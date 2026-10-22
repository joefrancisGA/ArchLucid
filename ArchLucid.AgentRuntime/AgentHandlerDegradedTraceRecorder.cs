using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Persists a minimal <see cref="AgentExecutionTrace" /> when handler resilience returns a degraded placeholder
///     (TB-034). Best-effort only — failures are logged and never block the degraded result path.
/// </summary>
public static class AgentHandlerDegradedTraceRecorder
{
    private const int MaxErrorMessageLength = 1024;

    /// <summary>Records partial forensic metadata for a pre-LLM or resilience degradation (no prompt bodies).</summary>
    public static async Task TryRecordAsync(
        IAgentExecutionTraceRecorder traceRecorder,
        ILogger logger,
        string runId,
        AgentTask task,
        string handlerKey,
        string degradationReasonCode,
        string operatorMessage,
        Exception degradationException,
        string promptTemplateVersion,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(traceRecorder);
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(task);
        ArgumentException.ThrowIfNullOrWhiteSpace(handlerKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(degradationReasonCode);
        ArgumentException.ThrowIfNullOrWhiteSpace(operatorMessage);
        ArgumentNullException.ThrowIfNull(degradationException);

        try
        {
            string templateId = handlerKey.Trim();
            string templateVersion = string.IsNullOrWhiteSpace(promptTemplateVersion)
                ? "default"
                : promptTemplateVersion.Trim();
            string systemPrompt = string.Empty;
            string userPrompt = string.Empty;
            string rawResponse = operatorMessage.Trim();
            string? errorMessage = TruncateErrorMessage(degradationException);

            AgentPromptReproMetadata promptRepro = new(
                TemplateId: templateId,
                TemplateVersion: templateVersion,
                SystemPromptContentSha256Hex: AgentPromptCanonicalHasher.Sha256HexUtf8Normalized(systemPrompt),
                ReleaseLabel: null);

            await traceRecorder.RecordAsync(
                runId,
                task.TaskId,
                task.AgentType,
                systemPrompt,
                userPrompt,
                rawResponse,
                parsedResultJson: null,
                parseSucceeded: false,
                errorMessage: errorMessage,
                promptRepro: promptRepro,
                inputTokenCount: 0,
                outputTokenCount: 0,
                reasoningTokenCount: 0,
                modelDeploymentName: AgentExecutionTraceModelMetadata.DegradedHandlerDeploymentName,
                modelVersion: AgentExecutionTraceModelMetadata.DegradedHandlerModelVersion,
                isSimulatorExecution: false,
                failureReasonCode: degradationReasonCode.Trim(),
                cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            if (logger.IsEnabled(LogLevel.Warning))
            {
                logger.LogWarning(
                    ex,
                    "Degraded handler trace insert failed for RunId={RunId} TaskId={TaskId} Agent={AgentType}.",
                    LogSanitizer.Sanitize(runId),
                    LogSanitizer.Sanitize(task.TaskId),
                    LogSanitizer.Sanitize(task.AgentType.ToString()));
            }
        }
    }

    private static string? TruncateErrorMessage(Exception exception)
    {
        string message = exception.Message.Trim();

        if (message.Length == 0)
        {
            return null;
        }

        if (message.Length <= MaxErrorMessageLength)
        {
            return message;
        }

        return string.Concat(message.AsSpan(0, MaxErrorMessageLength), "...[truncated]");
    }
}
