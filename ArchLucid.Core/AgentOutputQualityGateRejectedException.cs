namespace ArchLucid.Core;

/// <summary>
///     Thrown when <see cref="Configuration.AgentOutputQualityGateOptions.EnforceOnReject" /> is enabled and the
///     post-execute output quality gate rejects a trace. Pair with
///     <see cref="Configuration.AgentOutputQualityGateOptions.BlockRunOnReject" /> so the execute orchestrator marks the
///     run <c>ExecutionCompletedQualityRejected</c> and surfaces this exception to API callers.
/// </summary>
public sealed class AgentOutputQualityGateRejectedException : Exception
{
    public AgentOutputQualityGateRejectedException(string runId, string traceId, string agentLabel)
        : base($"Agent output quality gate rejected trace '{traceId}' (agent={agentLabel}) for run '{runId}'.")
    {
        RunId = runId;
        TraceId = traceId;
        AgentLabel = agentLabel;
    }

    public string RunId { get; }

    public string TraceId { get; }

    public string AgentLabel { get; }

    /// <summary>Safe, non-diagnostic copy for HTTP problem details.</summary>
    public const string UserFacingDetail =
        "The architecture review output did not meet your workspace quality bar for evidence depth and structure. " +
        "Add more architectural context and try again, or ask a workspace owner to review quality settings.";
}
