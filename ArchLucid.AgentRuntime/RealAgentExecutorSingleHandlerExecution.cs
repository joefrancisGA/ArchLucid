using System.Diagnostics;

using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Llm.Redaction;

using Polly;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

internal static class RealAgentExecutorSingleHandlerExecution
{
    internal static async Task<AgentResult> ExecuteSingleAsync(
        RealAgentExecutorExecutionDependencies dependencies,
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentTask task,
        AgentResult? persistedResult,
        CancellationToken cancellationToken)
    {
        using (AgentHandlerLlmReasoningTrace.BeginHandlerScope())
        {
            string dispatchKey = AgentTypeKeys.ResolveDispatchKey(task);

            if (AgentExecuteIdempotentResultPolicy.ShouldSkipRetry(persistedResult, out string? skipReason))
            {
                ArchLucidInstrumentation.AgentExecuteTaskSkippedIdempotentTotal.Add(
                    1,
                    new KeyValuePair<string, object?>("agent_type", task.AgentType.ToString()),
                    new KeyValuePair<string, object?>("reason", skipReason ?? "unknown"));

                if (dependencies.Logger.IsEnabled(LogLevel.Debug))
                {
                    dependencies.Logger.LogDebug(
                        "Skipping idempotent agent execute for RunId={RunId} TaskId={TaskId} Agent={AgentType} Reason={Reason}.",
                        runId,
                        task.TaskId,
                        dispatchKey,
                        skipReason);
                }

                return persistedResult!;
            }

            if (!dependencies.Handlers.TryGetValue(dispatchKey, out IAgentHandler? handler))
            {
                throw new InvalidOperationException(
                    $"No handler is registered for agent type key '{dispatchKey}'.");
            }

            AgentTaskAllowedToolsDispatchGuard.EnsureHandlerAllowed(task, dispatchKey);

            int timeoutSeconds = dependencies.ResilienceOptions.Value.ResolveTimeoutSecondsForAgent(dispatchKey);
            AgentExecutionResilienceOptions resilienceOptions = dependencies.ResilienceOptions.Value;
            ResiliencePipeline<AgentResult> handlerPipeline =
                RealAgentExecutorHandlerResiliencePipeline.Resolve(dispatchKey, timeoutSeconds, resilienceOptions);

            Stopwatch stopwatch = Stopwatch.StartNew();
            AgentResult result;

            using (Activity? activity = ArchLucidInstrumentation.AgentHandler.StartActivity("archlucid.agent.handle"))
            {
                activity?.SetTag("archlucid.run_id", runId);
                activity?.SetTag("archlucid.task_id", task.TaskId);
                activity?.SetTag("archlucid.agent.type", dispatchKey);
                activity?.SetTag("archlucid.agent.type_enum", task.AgentType.ToString());

                string promptVersion = ResolvePromptVersion(dependencies, dispatchKey);
                activity?.SetTag("archlucid.agent.prompt_version", promptVersion);

                try
                {
                    using (LlmAccountingInvocationScope.Begin(task.AgentType, LlmInvokeKind.Primary))
                    {
                        result = await dependencies.ConcurrencyGate.ExecuteAsync(
                            async ct =>
                                await handlerPipeline.ExecuteAsync(
                                    async (_, innerCt) => await handler.ExecuteAsync(
                                        runId,
                                        request,
                                        evidence,
                                        task,
                                        innerCt),
                                    ct, ct),
                            cancellationToken);
                    }

                    ArchLucidInstrumentation.AgentHandlerInvocationsTotal.Add(
                        1,
                        new KeyValuePair<string, object?>("agent_type_key", dispatchKey),
                        new KeyValuePair<string, object?>("outcome", "success"));
                }
                catch (Exception ex)
                {
                    if (RealAgentExecutorHandlerResiliencePipeline.ShouldUseDegradedFallback(task, resilienceOptions)
                        && RealAgentExecutorHandlerResiliencePipeline.IsDegradableFailure(ex))
                    {
                        if (dependencies.Logger.IsEnabled(LogLevel.Warning))
                        {
                            dependencies.Logger.LogWarning(
                                ex,
                                "Non-Critic agent handler degraded for RunId={RunId} TaskId={TaskId} Agent={AgentTypeKey}.",
                                runId,
                                task.TaskId,
                                dispatchKey);
                        }

                        string degradationReason = AgentHandlerDegradationTelemetry.ResolveReasonCode(ex);

                        result = AgentHandlerDegradedResultFactory.Create(
                            runId,
                            task,
                            degradationReason,
                            "Agent output degraded due to upstream LLM latency or circuit-open state; review run telemetry.");

                        AgentHandlerDegradationTelemetry.Record(
                            activity,
                            runId,
                            task,
                            dispatchKey,
                            degradationReason);

                        ArchLucidInstrumentation.AgentHandlerInvocationsTotal.Add(
                            1,
                            new KeyValuePair<string, object?>("agent_type_key", dispatchKey),
                            new KeyValuePair<string, object?>("outcome", "degraded"));

                        activity?.SetStatus(ActivityStatusCode.Error, "Agent handler degraded.");
                        activity?.AddException(ex);
                    }
                    else
                    {
                        activity?.SetStatus(ActivityStatusCode.Error, "Agent handler failed.");
                        activity?.AddException(ex);

                        ArchLucidInstrumentation.AgentHandlerInvocationsTotal.Add(
                            1,
                            new KeyValuePair<string, object?>("agent_type_key", dispatchKey),
                            new KeyValuePair<string, object?>("outcome", "error"));

                        throw new AgentExecutionFailedException(
                            runId,
                            task.TaskId,
                            new AgentHandlerExecutionException(dispatchKey, task.AgentType, ex));
                    }
                }

                activity?.SetTag("archlucid.agent.confidence", result.Confidence);
                activity?.SetTag("archlucid.agent.findings_count", result.Findings.Count);
                activity?.SetTag("archlucid.agent.claims_count", result.Claims.Count);
            }

            stopwatch.Stop();

            if (dependencies.Logger.IsEnabled(LogLevel.Debug))
                dependencies.Logger.LogDebugAgentTaskFinished(runId, task.TaskId, dispatchKey, stopwatch.ElapsedMilliseconds);

            string? providerTrace = AgentHandlerLlmReasoningTrace.TryConsumeBuffered();

            return MergeProviderReasoningTrace(dependencies, result, providerTrace);
        }
    }

    private static AgentResult MergeProviderReasoningTrace(
        RealAgentExecutorExecutionDependencies dependencies,
        AgentResult result,
        string? providerTrace)
    {
        if (!string.IsNullOrWhiteSpace(providerTrace))
        {
            string trimmed = providerTrace.Trim();

            if (string.IsNullOrWhiteSpace(result.ReasoningTrace))
                result.ReasoningTrace = trimmed;
            else
                result.ReasoningTrace = result.ReasoningTrace.TrimEnd() + "\n\n---\n\n" + trimmed;
        }

        if (!dependencies.ArchLucidLlmOptions.CurrentValue.RedactReasoningTrace || string.IsNullOrWhiteSpace(result.ReasoningTrace))
            return result;

        PromptRedactionOutcome outcome = dependencies.PromptRedactor.RedactAlways(result.ReasoningTrace);

        foreach (KeyValuePair<string, int> pair in outcome.CountsByCategory)
            ArchLucidInstrumentation.RecordLlmPromptRedactions(pair.Key, pair.Value);

        result.ReasoningTrace = outcome.Text;

        return result;
    }

    private static string ResolvePromptVersion(RealAgentExecutorExecutionDependencies dependencies, string agentTypeKey)
    {
        AgentPromptCatalogOptions current = dependencies.PromptCatalog.CurrentValue;

        if (current.Versions.TryGetValue(agentTypeKey, out string? version) && !string.IsNullOrWhiteSpace(version))
            return version.Trim();

        return "default";
    }
}
