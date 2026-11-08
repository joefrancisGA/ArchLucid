using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Retrieval.Graph;

/// <summary>
/// Read-only fixture entry point to the production bounded GraphRAG neighbor collector.
/// No repository, tenant state, search ranking or external service is involved.
/// </summary>
public static class GraphRagTraversalBenchmarkAdapter
{
    public static int CountNeighbors(GraphSnapshot snapshot, string seedNodeId, int maxHops, int maxNeighbors)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        if (snapshot.Nodes.Count > 20_000 || snapshot.Edges.Count > 80_000 ||
            maxHops is < 1 or > 4 || maxNeighbors is < 1 or > 10_000)
            throw new ArgumentOutOfRangeException(nameof(snapshot), "Benchmark traversal limits exceeded.");
        return GraphRagBoundedNeighborCollector.Collect(snapshot, seedNodeId, maxHops, maxNeighbors).Count;
    }
}
