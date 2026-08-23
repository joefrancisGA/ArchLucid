using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>Shared LLM schema-completion pipeline for agent handlers.</summary>
public static class AgentHandlerCompletionExecutor
{
    public static async Task<AgentResult> CompleteWithSchemaRemediationAsync(
        IAgentTierCompletionRouter tierCompletionRouter,
        ISchemaRemediationAgentCompletionClient schemaRemediationClient,
        IAgentResultParser resultParser,
        IOptionsMonitor<AgentSchemaRemediationOptions> schemaRemediationOptions,
        IAgentExecutionTraceRecorder traceRecorder,
        IAuditService auditService,
        IScopeContextProvider scopeContextProvider,
        ILogger? logger,
        AgentType agentType,
        string runId,
        AgentTask task,
        ArchitectureRequest request,
        string systemPrompt,
        string userPrompt,
        AgentPromptReproMetadata promptRepro,
        string? promptVariantKey,
        Func<AgentResult, Task<AgentResult>>? finalizeResultAsync = null,
        bool applyFindingEnforcementTier = true,
        bool consumeTokenUsageOnFailure = false,
        CancellationToken cancellationToken = default)
    {
        string lastCompletionJson = string.Empty;

        try
        {
            (IAgentCompletionClient completionClient, IAgentCompletionClient remediationClient) =
                AgentHandlerLlmResolution.ResolveCompletionClients(
                    tierCompletionRouter,
                    schemaRemediationClient,
                    agentType,
                    task);

            (string rawJson, AgentResult parsed) = await LlmAgentSchemaCompletion.CompleteAsync(
                completionClient,
                resultParser,
                schemaRemediationOptions,
                agentType,
                runId,
                task.TaskId,
                systemPrompt,
                userPrompt,
                request.MaxTokensOverride,
                remediationClient,
                logger,
                traceRecorder,
                promptRepro,
                cancellationToken);

            lastCompletionJson = rawJson;
            parsed.PromptVariantKey = promptVariantKey;

            AgentResult result = finalizeResultAsync is not null
                ? await finalizeResultAsync(parsed).ConfigureAwait(false)
                : parsed;

            if (applyFindingEnforcementTier)
                AgentResultFindingEnforcementTierApplier.Apply(result);

            return result;
        }
        catch (Exception ex)
        {
            int? inTok;
            int? outTok;
            int? reasoningTok;

            if (consumeTokenUsageOnFailure)
                AgentCompletionTokenUsage.TryConsume(out inTok, out outTok, out reasoningTok);
            else
                AgentCompletionTokenUsage.TryPeek(out inTok, out outTok, out reasoningTok);

            AgentCompletionModelMetadata.TryConsume(out string? modelDeploy, out string? modelVer);

            if (ex is AgentResultSchemaViolationException schemaViolation)

                AgentResultSchemaViolationAudit.ScheduleLog(
                    auditService,
                    scopeContextProvider,
                    schemaViolation,
                    runId,
                    task.TaskId,
                    modelDeploy,
                    modelVer);

            if (!AgentSchemaRemediationTraceSupport.ShouldSkipHandlerFailureTrace(ex))
            {
                await traceRecorder.RecordAsync(
                    runId,
                    task.TaskId,
                    agentType,
                    systemPrompt,
                    userPrompt,
                    lastCompletionJson,
                    null,
                    false,
                    ex.Message,
                    promptRepro,
                    inTok,
                    outTok,
                    reasoningTok,
                    modelDeploy,
                    modelVer,
                    failureReasonCode: AgentHandlerExecutionFailureReason.ResolveFailureReasonCode(ex),
                    cancellationToken: cancellationToken);
            }

            throw;
        }
    }
}
