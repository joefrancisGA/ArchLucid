namespace ArchLucid.Core.Retrieval;

/// <summary>Graph-RAG expansion counters derived from persisted retrieval hits.</summary>
public static class GraphRagRetrievalTelemetry
{
    /// <summary>Source type written by <see cref="Graph.GraphRagNeighborExpander" /> for 1-hop neighbors.</summary>
    public const string NeighborSourceType = "KnowledgeGraphNodeNeighbor";

    /// <summary>Source type for vector-matched knowledge-graph seed hits.</summary>
    public const string SeedSourceType = "KnowledgeGraphNode";

    /// <summary>Share of neighbor chunks above which pilot floor warns when citation coverage is low.</summary>
    public const double PilotFloorNeighborShareWarnThreshold = 0.5;

    /// <summary>Citation coverage below which high Graph-RAG neighbor share triggers pilot floor WARN.</summary>
    public const double PilotFloorMinCitationCoverage = 0.5;

    public static GraphRagHitCounts CountFromHits(IReadOnlyList<RetrievalHit>? hits)
    {
        if (hits is null || hits.Count == 0)
            return GraphRagHitCounts.Empty;

        int neighborsAdded = 0;
        int seedHits = 0;

        foreach (RetrievalHit hit in hits)
        {
            if (hit is null)
                continue;

            if (string.Equals(hit.SourceType, NeighborSourceType, StringComparison.OrdinalIgnoreCase))
            {
                neighborsAdded++;
                continue;
            }

            if (string.Equals(hit.SourceType, SeedSourceType, StringComparison.OrdinalIgnoreCase))
                seedHits++;
        }

        return new GraphRagHitCounts(neighborsAdded, seedHits);
    }

    public static double ResolveNeighborHitRate(int neighborsAdded, int totalRetrievedChunks)
    {
        if (totalRetrievedChunks <= 0)
            return 0d;

        return neighborsAdded / (double)totalRetrievedChunks;
    }

    public static bool ShouldApplyPilotFloorWarn(double neighborHitRate, double averageCitationCoverage)
    {
        return neighborHitRate >= PilotFloorNeighborShareWarnThreshold
               && averageCitationCoverage < PilotFloorMinCitationCoverage;
    }
}

/// <summary>Graph-RAG seed and neighbor counts for one retrieval query.</summary>
public readonly record struct GraphRagHitCounts(int NeighborsAdded, int SeedHits)
{
    public static GraphRagHitCounts Empty { get; } = new(0, 0);
}
