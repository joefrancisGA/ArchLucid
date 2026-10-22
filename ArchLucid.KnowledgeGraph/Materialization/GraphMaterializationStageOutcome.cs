namespace ArchLucid.KnowledgeGraph.Materialization;

/// <summary>
///     Per-stage telemetry captured by <see cref="GraphMaterializationPipeline" /> (TB-2370).
/// </summary>
public sealed class GraphMaterializationStageOutcome
{
    public required string StageName { get; init; }

    public long ElapsedMilliseconds { get; init; }

    public int NodesAdded { get; init; }

    public bool Skipped { get; init; }
}
