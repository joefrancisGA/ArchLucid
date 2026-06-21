using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Shared helpers for persisting schema-remediation attempt traces (TB-035) and skipping duplicate handler failure rows.
/// </summary>
public static class AgentSchemaRemediationTraceSupport
{
    /// <summary>
    ///     When <see langword="true" />, <see cref="LlmAgentSchemaCompletion" /> already persisted the terminal failure row
    ///     and the handler catch block should not call <see cref="IAgentExecutionTraceRecorder.RecordAsync" /> again.
    /// </summary>
    public static bool ShouldSkipHandlerFailureTrace(Exception ex)
    {
        ArgumentNullException.ThrowIfNull(ex);

        if (ex is AgentResultSchemaViolationException or AgentResultValidationException)
            return true;

        if (ex is InvalidOperationException ioEx)
            return IsRetryableAgentResultParseFailure(ioEx);

        return false;
    }

    /// <summary>
    ///     Persists one schema-remediation attempt when <paramref name="traceRecorder" /> is non-null.
    /// </summary>
    public static async Task RecordAttemptAsync(
        IAgentExecutionTraceRecorder? traceRecorder,
        int attemptIndex,
        string runId,
        string taskId,
        AgentType agentType,
        string systemPrompt,
        string userPrompt,
        string rawResponse,
        bool parseSucceeded,
        string? errorMessage,
        AgentPromptReproMetadata? promptRepro,
        string? parsedResultJson = null,
        CancellationToken cancellationToken = default)
    {
        if (traceRecorder is null)
            return;

        AgentCompletionTokenUsage.TryConsume(out int? inTok, out int? outTok, out int? reasoningTok);
        AgentCompletionModelMetadata.TryConsume(out string? modelDeploy, out string? modelVer);

        string? failureReasonCode = parseSucceeded
            ? null
            : AgentExecutionTraceFailureReasonCodes.SchemaRemediationParseFailed;

        await traceRecorder
            .RecordAsync(
                runId,
                taskId,
                agentType,
                systemPrompt,
                userPrompt,
                rawResponse,
                parsedResultJson,
                parseSucceeded,
                errorMessage,
                promptRepro,
                inTok,
                outTok,
                reasoningTok,
                modelDeploy,
                modelVer,
                failureReasonCode: failureReasonCode,
                attemptIndex: attemptIndex,
                cancellationToken: cancellationToken)
            .ConfigureAwait(false);
    }

    internal static bool IsRetryableAgentResultParseFailure(InvalidOperationException ex)
    {
        if (ex.InnerException is System.Text.Json.JsonException)
            return true;

        string msg = ex.Message;

        if (msg.Contains("empty JSON", StringComparison.OrdinalIgnoreCase))
            return true;

        if (msg.Contains("null AgentResult", StringComparison.OrdinalIgnoreCase))
            return true;

        if (msg.Contains("deserialize AgentResult", StringComparison.OrdinalIgnoreCase))
            return true;

        if (msg.Contains("unsupported type mapping", StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }

    internal static string BuildParseFailureDetail(InvalidOperationException ex)
    {
        if (ex.InnerException is System.Text.Json.JsonException jx)
            return "JSON parse error: " + jx.Message.Trim();

        return ex.Message.Trim();
    }
}
