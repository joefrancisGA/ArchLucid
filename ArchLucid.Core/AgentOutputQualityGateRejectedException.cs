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
    string? evaluationReason = null,
    double? structuralCompletenessRatio = null,
    double? semanticScore = null,
    string? rejectReasonCategory = null,
    string? triageScenarioId = null,
    string? gateDefinitionVersion = null,
    string? gateDefinitionContentHashSha256 = null,
    string? gateMode = null)
    : Exception($"Agent output quality gate rejected trace '{traceId}' (agent={agentLabel}) for run '{runId}'.")
{
    public string RunId { get; } = runId;

    public string TraceId { get; } = traceId;

    public string AgentLabel { get; } = agentLabel;

    /// <summary>Deterministic, non-prompt rejection tags for API problem detail extensions (may be null).</summary>
    public string? EvaluationReason { get; } =
        string.IsNullOrWhiteSpace(evaluationReason) ? null : evaluationReason.Trim();

    /// <summary>Structural completeness ratio at evaluate time (TB-964).</summary>
    public double? StructuralCompletenessRatio { get; } = structuralCompletenessRatio;

    /// <summary>Semantic score at evaluate time (TB-964).</summary>
    public double? SemanticScore { get; } = semanticScore;

    /// <summary>Reject reason category at evaluate time (TB-964).</summary>
    public string? RejectReasonCategory { get; } =
        string.IsNullOrWhiteSpace(rejectReasonCategory) ? null : rejectReasonCategory.Trim();

    /// <summary>Triage scenario id when quality gate fired (TB-964).</summary>
    public string? TriageScenarioId { get; } =
        string.IsNullOrWhiteSpace(triageScenarioId) ? null : triageScenarioId.Trim();

    /// <summary>Gate definition version at evaluate time (TB-973).</summary>
    public string? GateDefinitionVersion { get; } =
        string.IsNullOrWhiteSpace(gateDefinitionVersion) ? null : gateDefinitionVersion.Trim();

    /// <summary>Gate definition content hash at evaluate time (TB-973).</summary>
    public string? GateDefinitionContentHashSha256 { get; } =
        string.IsNullOrWhiteSpace(gateDefinitionContentHashSha256) ? null : gateDefinitionContentHashSha256.Trim();

    /// <summary>Gate mode at evaluate time (TB-973).</summary>
    public string? GateMode { get; } =
        string.IsNullOrWhiteSpace(gateMode) ? null : gateMode.Trim();

    /// <summary>Safe, non-diagnostic copy for HTTP problem details.</summary>
    public const string UserFacingDetail =
        "The architecture review output did not meet your workspace quality bar for evidence depth and structure. " +
        "Add more architectural context and try again, or ask a workspace owner to review quality settings.";
}
