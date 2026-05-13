namespace ArchLucid.Core;

/// <summary>
///     Thrown when <see cref="Configuration.AgentOutputQualityGateOptions.EnforceOnReject" /> is enabled and the
///     post-execute output quality gate rejects a trace. Pair with
///     <see cref="Configuration.AgentOutputQualityGateOptions.BlockRunOnReject" /> so the execute orchestrator marks the
///     run <c>ExecutionCompletedQualityRejected</c> and surfaces this exception to API callers.
/// </summary>
public sealed class AgentOutputQualityGateRejectedException(
    string runId,
    string traceId,
    string agentLabel,
    string? evaluationReason = null)
    : Exception($"Agent output quality gate rejected trace '{traceId}' (agent={agentLabel}) for run '{runId}'.")
{
    public string RunId { get; } = runId;

    public string TraceId { get; } = traceId;

    public string AgentLabel { get; } = agentLabel;

    /// <summary>Deterministic, non-prompt rejection tags for API problem detail extensions (may be null).</summary>
    public string? EvaluationReason { get; } =
        string.IsNullOrWhiteSpace(evaluationReason) ? null : evaluationReason.Trim();

    /// <summary>Safe, non-diagnostic copy for HTTP problem details.</summary>
    public const string UserFacingDetail =
        "The architecture review output did not meet your workspace quality bar for evidence depth and structure. " +
        "Add more architectural context and try again, or ask a workspace owner to review quality settings.";
}
