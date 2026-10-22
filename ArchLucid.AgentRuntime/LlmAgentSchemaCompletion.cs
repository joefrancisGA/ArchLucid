using System.Text;
using System.Text.Json;

using ArchLucid.AgentRuntime.Caching;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Shared LLM → JSON schema validation loop for topology / compliance / critic handlers when the model emits invalid
///     structured payloads.
/// </summary>
public static class LlmAgentSchemaCompletion
{
    private static readonly JsonSerializerOptions TraceJsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true
    };

    /// <summary>
    ///     Calls <paramref name="completionClient" />; on schema violations, JSON parse failures, or post-parse validation
    ///     errors retries with remediation text until attempts are exhausted or output validates.
    /// </summary>
    public static async Task<(string RawJson, AgentResult Parsed)> CompleteAsync(
        IAgentCompletionClient completionClient,
        IAgentResultParser resultParser,
        IOptionsMonitor<AgentSchemaRemediationOptions> remediationOptions,
        AgentType agentType,
        string runId,
        string taskId,
        string systemPrompt,
        string baseUserPrompt,
        int? maxTokensOverride = null,
        IAgentCompletionClient? remediationCompletionClient = null,
        ILogger? logger = null,
        IAgentExecutionTraceRecorder? traceRecorder = null,
        AgentPromptReproMetadata? promptRepro = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(completionClient);
        ArgumentNullException.ThrowIfNull(resultParser);
        ArgumentNullException.ThrowIfNull(remediationOptions);
        ArgumentException.ThrowIfNullOrWhiteSpace(systemPrompt);

        int maxAttempts = remediationOptions.CurrentValue.MaxCompletionAttempts;

        if (maxAttempts < 1)
            maxAttempts = 1;

        if (maxAttempts > AgentSchemaRemediationOptions.MaxCompletionAttemptsCeiling)
            maxAttempts = AgentSchemaRemediationOptions.MaxCompletionAttemptsCeiling;

        RemediationState? lastRemediation = null;
        int schemaRetryCount = 0;
        string agentTypeLabel = agentType.ToString();
        string promptVersion = promptRepro?.TemplateVersion ?? "none";

        // Defer completion-cache writes until ParseAndValidate succeeds; bust cache-served poison on failure (TB-940).
        using (LlmCompletionCacheDeferredAdmission.EnterSchemaAdmissionGate())
        using (LlmCompletionCacheKeyAmbient.Push(promptVersion, schemaVersion: "agent-result-json-v1"))
        {
            try
            {
                for (int attemptIndex = 0; attemptIndex < maxAttempts; attemptIndex++)
                {
                    cancellationToken.ThrowIfCancellationRequested();

                    string userPrompt = BuildUserPrompt(baseUserPrompt, lastRemediation);

                    IAgentCompletionClient activeClient = lastRemediation is null
                        ? completionClient
                        : remediationCompletionClient ?? completionClient;

                    string rawJson = await activeClient
                        .CompleteJsonAsync(
                            systemPrompt,
                            userPrompt,
                            maxTokens: maxTokensOverride,
                            cancellationToken: cancellationToken)
                        .ConfigureAwait(false);

                    try
                    {
                        AgentResult parsed = resultParser.ParseAndValidate(
                            rawJson,
                            runId,
                            taskId,
                            agentType,
                            cancellationToken);

                        await LlmCompletionCacheDeferredAdmission.CommitAsync(cancellationToken).ConfigureAwait(false);

                        ArchLucidInstrumentation.RecordAgentSchemaRemediationCompletion(agentTypeLabel, schemaRetryCount);

                        if (logger?.IsEnabled(LogLevel.Information) == true)
                        {
                            logger.LogInformation(
                                "Agent schema remediation completed for {AgentType} after {SchemaRetryCount} retries.",
                                agentTypeLabel,
                                schemaRetryCount);
                        }

                        string parsedJson = JsonSerializer.Serialize(parsed, TraceJsonOptions);

                        await AgentSchemaRemediationTraceSupport
                            .RecordAttemptAsync(
                                traceRecorder,
                                attemptIndex,
                                runId,
                                taskId,
                                agentType,
                                systemPrompt,
                                userPrompt,
                                rawJson,
                                parseSucceeded: true,
                                errorMessage: null,
                                promptRepro,
                                parsedJson,
                                cancellationToken)
                            .ConfigureAwait(false);

                        return (rawJson, parsed);
                    }
                    catch (AgentResultSchemaViolationException ex)
                    {
                        await LlmCompletionCacheDeferredAdmission
                            .DiscardOrBustOnSchemaFailureAsync(cancellationToken)
                            .ConfigureAwait(false);

                        await PersistFailedAttemptAsync(
                            traceRecorder,
                            attemptIndex,
                            runId,
                            taskId,
                            agentType,
                            systemPrompt,
                            userPrompt,
                            rawJson,
                            ex.Message,
                            promptRepro,
                            cancellationToken)
                            .ConfigureAwait(false);

                        if (!MoreAttemptsRemain(attemptIndex, maxAttempts))
                            throw;

                        schemaRetryCount++;
                        ArchLucidInstrumentation.RecordAgentSchemaRemediationRetry(agentTypeLabel);

                        lastRemediation = RemediationState.FromSchemaViolation(ex);
                    }
                    catch (AgentResultValidationException ex)
                    {
                        await LlmCompletionCacheDeferredAdmission
                            .DiscardOrBustOnSchemaFailureAsync(cancellationToken)
                            .ConfigureAwait(false);

                        await PersistFailedAttemptAsync(
                            traceRecorder,
                            attemptIndex,
                            runId,
                            taskId,
                            agentType,
                            systemPrompt,
                            userPrompt,
                            rawJson,
                            ex.Message,
                            promptRepro,
                            cancellationToken)
                            .ConfigureAwait(false);

                        if (!MoreAttemptsRemain(attemptIndex, maxAttempts))
                            throw;

                        schemaRetryCount++;
                        ArchLucidInstrumentation.RecordAgentSchemaRemediationRetry(agentTypeLabel);

                        lastRemediation = RemediationState.FromPlainDetail(ex.Message);
                    }
                    catch (InvalidOperationException ex) when (
                        AgentSchemaRemediationTraceSupport.IsRetryableAgentResultParseFailure(ex))
                    {
                        await LlmCompletionCacheDeferredAdmission
                            .DiscardOrBustOnSchemaFailureAsync(cancellationToken)
                            .ConfigureAwait(false);

                        string detail = AgentSchemaRemediationTraceSupport.BuildParseFailureDetail(ex);

                        await PersistFailedAttemptAsync(
                            traceRecorder,
                            attemptIndex,
                            runId,
                            taskId,
                            agentType,
                            systemPrompt,
                            userPrompt,
                            rawJson,
                            detail,
                            promptRepro,
                            cancellationToken)
                            .ConfigureAwait(false);

                        if (!MoreAttemptsRemain(attemptIndex, maxAttempts))
                            throw;

                        schemaRetryCount++;
                        ArchLucidInstrumentation.RecordAgentSchemaRemediationRetry(agentTypeLabel);

                        lastRemediation = RemediationState.FromPlainDetail(detail);
                    }
                }

                throw new InvalidOperationException(
                    $"Unexpected exit from agent schema completion loop ({agentType}, maxAttempts={maxAttempts}).");
            }
            finally
            {
                // Drop any staged miss body; bust only when the pending entry was cache-served.
                await LlmCompletionCacheDeferredAdmission
                    .DiscardOrBustOnSchemaFailureAsync(cancellationToken)
                    .ConfigureAwait(false);
            }
        }
    }

    private static async Task PersistFailedAttemptAsync(
        IAgentExecutionTraceRecorder? traceRecorder,
        int attemptIndex,
        string runId,
        string taskId,
        AgentType agentType,
        string systemPrompt,
        string userPrompt,
        string rawJson,
        string errorMessage,
        AgentPromptReproMetadata? promptRepro,
        CancellationToken cancellationToken)
    {
        await AgentSchemaRemediationTraceSupport
            .RecordAttemptAsync(
                traceRecorder,
                attemptIndex,
                runId,
                taskId,
                agentType,
                systemPrompt,
                userPrompt,
                rawJson,
                parseSucceeded: false,
                errorMessage,
                promptRepro,
                parsedResultJson: null,
                cancellationToken)
            .ConfigureAwait(false);
    }

    private static bool MoreAttemptsRemain(int attemptIndex, int maxAttempts)
    {
        return attemptIndex < maxAttempts - 1;
    }

    private static string BuildUserPrompt(string baseUserPrompt, RemediationState? remediation)
    {
        if (remediation is null)
            return baseUserPrompt;

        StringBuilder sb = new();

        sb.Append(baseUserPrompt.TrimEnd());
        sb.Append("\n\nRemediation: Correct the JSON ONLY. Previous output failed validation.\n");

        if (remediation.SchemaViolation is { } sv)
        {
            foreach (string line in sv.SchemaErrors.Select(static e => "- " + e.Trim()))
                sb.AppendLine(line);
        }

        if (!string.IsNullOrWhiteSpace(remediation.PlainTextDetail))
            sb.AppendLine("- " + remediation.PlainTextDetail.Trim());

        return sb.ToString();
    }

    private sealed record RemediationState(
        AgentResultSchemaViolationException? SchemaViolation,
        string? PlainTextDetail)
    {
        public static RemediationState FromSchemaViolation(AgentResultSchemaViolationException ex)
        {
            return new RemediationState(ex, null);
        }

        public static RemediationState FromPlainDetail(string detail)
        {
            return new RemediationState(null, detail);
        }
    }
}
