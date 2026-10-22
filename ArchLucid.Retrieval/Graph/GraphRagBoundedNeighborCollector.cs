using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Retrieval.Graph;

/// <summary>Bounded breadth-first neighbor collection for Graph-RAG expansion (TB-597).</summary>
internal static class GraphRagBoundedNeighborCollector
{
    internal static IReadOnlyList<GraphRagNeighborHop> Collect(
        GraphSnapshot snapshot,
        string seedNodeId,
        int maxHops,
        int maxNeighbors)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentException.ThrowIfNullOrWhiteSpace(seedNodeId);

        int effectiveMaxHops = Math.Clamp(maxHops, 1, 4);
        int effectiveMaxNeighbors = Math.Max(1, maxNeighbors);
        IReadOnlyDictionary<string, HashSet<string>> adjacency = BuildAdjacency(snapshot.Edges);
        Queue<(string NodeId, int Hop)> frontier = new();
        HashSet<string> visited = new(StringComparer.OrdinalIgnoreCase) { seedNodeId };
        List<GraphRagNeighborHop> results = [];

        if (!adjacency.TryGetValue(seedNodeId, out HashSet<string>? seedNeighbors))
            return results;

        foreach (string neighborId in seedNeighbors)
        {
            if (visited.Add(neighborId))
                frontier.Enqueue((neighborId, 1));
        }

        while (frontier.Count > 0 && results.Count < effectiveMaxNeighbors)
        {
            (string nodeId, int hop) = frontier.Dequeue();
            GraphNode? node = FindNode(snapshot.Nodes, nodeId);

            if (node is null)
                continue;

            results.Add(new GraphRagNeighborHop(node, hop));

            if (results.Count >= effectiveMaxNeighbors)
                break;

            if (hop >= effectiveMaxHops)
                continue;

            if (!adjacency.TryGetValue(nodeId, out HashSet<string>? nextNeighbors))
                continue;

            foreach (string nextId in nextNeighbors)
            {
                if (visited.Add(nextId))
                    frontier.Enqueue((nextId, hop + 1));
            }
        }

        return results;
    }

    private static GraphNode? FindNode(IReadOnlyList<GraphNode> nodes, string nodeId)
    {
        foreach (GraphNode node in nodes)
        {
            if (string.Equals(node.NodeId, nodeId, StringComparison.OrdinalIgnoreCase))
                return node;
        }

        return null;
    }

    private static IReadOnlyDictionary<string, HashSet<string>> BuildAdjacency(IReadOnlyList<GraphEdge> edges)
    {
        Dictionary<string, HashSet<string>> adjacency = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphEdge edge in edges)
        {
            AddEdge(adjacency, edge.FromNodeId, edge.ToNodeId);
            AddEdge(adjacency, edge.ToNodeId, edge.FromNodeId);
        }

        return adjacency;
    }

    private static void AddEdge(Dictionary<string, HashSet<string>> adjacency, string fromNodeId, string toNodeId)
    {
        if (string.IsNullOrWhiteSpace(fromNodeId) || string.IsNullOrWhiteSpace(toNodeId))
            return;

        if (!adjacency.TryGetValue(fromNodeId, out HashSet<string>? neighbors))
        {
            neighbors = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            adjacency[fromNodeId] = neighbors;
        }

        neighbors.Add(toNodeId);
    }
}
