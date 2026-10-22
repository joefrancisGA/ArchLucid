namespace ArchLucid.KnowledgeGraph.Materialization;

/// <summary>
///     Result of a graph materialization pipeline run, including optional per-stage telemetry (TB-2370).
/// </summary>
public sealed class GraphMaterializationRunResult
{
    public IReadOnlyList<GraphMaterializationStageOutcome> StageOutcomes { get; init; } = [];

    public long TotalElapsedMilliseconds { get; init; }
}
