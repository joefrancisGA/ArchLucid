namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

/// <summary>
///     Canonical authority pipeline stage names and the success outcome recorded in
///     <c>RunStageOutcomes</c>. Must match <see cref="AuthorityPipelineStagesExecutor" /> execution order.
/// </summary>
public static class AuthorityPipelineStageNames
{
    public const string ContextIngestion = "context_ingestion";

    public const string Graph = "graph";

    public const string Findings = "findings";

    public const string Decisioning = "decisioning";

    public const string Artifacts = "artifacts";

    /// <summary>Persisted <c>OutcomeStatus</c> when a stage completes successfully.</summary>
    public const string SucceededOutcomeStatus = "succeeded";

    /// <summary>
    ///     Ordered authority stages: context ingestion, graph, findings, decisioning, artifacts.
    /// </summary>
    public static readonly string[] Sequence =
    [
        ContextIngestion,
        Graph,
        Findings,
        Decisioning,
        Artifacts
    ];
}
