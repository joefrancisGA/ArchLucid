using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Bounded graph walk from external actors to sensitive datastores without crossing a trust-boundary or private-endpoint hop (DX-32).
/// </summary>
public static class DataFlowTrustBoundaryPathAnalyzer
{
    public const int MaxHopCount = 8;

    public const int MaxFindings = 20;

    private static readonly string[] PrivateEndpointPropertyKeys =
    [
        "privateEndpoint",
        "privateEndpointEnabled",
        "privateLink",
        "isPrivateEndpoint",
    ];

    public static IReadOnlyList<DataFlowTrustBoundaryPath> Analyze(GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        if (graphSnapshot.Nodes is null || graphSnapshot.Nodes.Count == 0)
        {
            return [];
        }

        if (graphSnapshot.Edges is null || graphSnapshot.Edges.Count == 0)
        {
            return [];
        }

        Dictionary<string, GraphNode> nodesById = graphSnapshot.Nodes
            .Where(static node => !string.IsNullOrWhiteSpace(node.NodeId))
            .GroupBy(static node => node.NodeId.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(static group => group.Key, static group => group.First(), StringComparer.OrdinalIgnoreCase);

        Dictionary<string, List<string>> adjacency = BuildAdjacency(graphSnapshot, nodesById);

        List<DataFlowTrustBoundaryPath> paths = [];

        foreach (GraphNode actor in graphSnapshot.GetNodesByType(GraphNodeTypes.Actor).Where(ActorOriginHeuristics.IsExternalFacingActor))
        {
            CollectPathsFromActor(actor, nodesById, adjacency, paths);
        }

        return paths
            .GroupBy(
                static path => $"{path.ActorNodeId}|{path.DatastoreNodeId}",
                StringComparer.OrdinalIgnoreCase)
            .Select(static group => group.OrderBy(static path => path.HopCount).First())
            .OrderByDescending(static path => path.HopCount)
            .ThenBy(static path => path.ActorLabel, StringComparer.OrdinalIgnoreCase)
            .Take(MaxFindings)
            .ToList();
    }

    public static bool HopCrossesTrustBoundary(GraphNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        if (string.Equals(node.NodeType, GraphNodeTypes.TrustBoundary, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return HasPrivateEndpointProperty(node);
    }

    private static void CollectPathsFromActor(
        GraphNode actor,
        IReadOnlyDictionary<string, GraphNode> nodesById,
        IReadOnlyDictionary<string, List<string>> adjacency,
        List<DataFlowTrustBoundaryPath> paths)
    {
        Queue<(string NodeId, int HopCount, List<string> PathNodeIds)> queue = new();
        HashSet<string> visited = new(StringComparer.OrdinalIgnoreCase)
        {
            actor.NodeId,
        };

        queue.Enqueue((actor.NodeId, 0, [actor.NodeId]));

        while (queue.Count > 0)
        {
            (string nodeId, int hopCount, List<string> pathNodeIds) = queue.Dequeue();

            if (hopCount >= MaxHopCount)
            {
                continue;
            }

            if (!nodesById.TryGetValue(nodeId, out GraphNode? currentNode))
            {
                continue;
            }

            if (!adjacency.TryGetValue(nodeId, out List<string>? neighbors))
            {
                continue;
            }

            foreach (string neighborId in neighbors)
            {
                if (visited.Contains(neighborId))
                {
                    continue;
                }

                if (!nodesById.TryGetValue(neighborId, out GraphNode? neighbor))
                {
                    continue;
                }

                visited.Add(neighborId);
                List<string> nextPath = [.. pathNodeIds, neighborId];
                int nextHopCount = hopCount + 1;

                if (SegmentationSemanticsPathAnalyzer.IsSensitiveTarget(neighbor)
                    && !PathCrossesTrustBoundary(nextPath, nodesById))
                {
                    paths.Add(new DataFlowTrustBoundaryPath(
                        actor.NodeId,
                        ResolveLabel(actor),
                        neighbor.NodeId,
                        ResolveLabel(neighbor),
                        nextHopCount,
                        nextPath.ToList()));
                }

                queue.Enqueue((neighborId, nextHopCount, nextPath));
            }
        }
    }

    private static bool PathCrossesTrustBoundary(
        IReadOnlyList<string> pathNodeIds,
        IReadOnlyDictionary<string, GraphNode> nodesById)
    {
        foreach (string nodeId in pathNodeIds)
        {
            if (!nodesById.TryGetValue(nodeId, out GraphNode? node))
            {
                continue;
            }

            if (HopCrossesTrustBoundary(node))
            {
                return true;
            }
        }

        return false;
    }

    private static bool HasPrivateEndpointProperty(GraphNode node)
    {
        foreach (string key in PrivateEndpointPropertyKeys)
        {
            if (!TryGetProperty(node.Properties, key, out string? value))
            {
                continue;
            }

            if (string.Equals(value, "true", StringComparison.OrdinalIgnoreCase)
                || string.Equals(value, "1", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static Dictionary<string, List<string>> BuildAdjacency(
        GraphSnapshot graphSnapshot,
        IReadOnlyDictionary<string, GraphNode> nodesById)
    {
        Dictionary<string, List<string>> adjacency = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphEdge edge in graphSnapshot.Edges!)
        {
            if (string.IsNullOrWhiteSpace(edge.FromNodeId)
                || string.IsNullOrWhiteSpace(edge.ToNodeId))
            {
                continue;
            }

            if (!nodesById.ContainsKey(edge.FromNodeId) || !nodesById.ContainsKey(edge.ToNodeId))
            {
                continue;
            }

            AddNeighbor(adjacency, edge.FromNodeId, edge.ToNodeId);
            AddNeighbor(adjacency, edge.ToNodeId, edge.FromNodeId);
        }

        return adjacency;
    }

    private static void AddNeighbor(Dictionary<string, List<string>> adjacency, string fromNodeId, string toNodeId)
    {
        if (!adjacency.TryGetValue(fromNodeId, out List<string>? neighbors))
        {
            neighbors = [];
            adjacency[fromNodeId] = neighbors;
        }

        if (!neighbors.Contains(toNodeId, StringComparer.OrdinalIgnoreCase))
        {
            neighbors.Add(toNodeId);
        }
    }

    private static string ResolveLabel(GraphNode node) =>
        string.IsNullOrWhiteSpace(node.Label) ? node.NodeId : node.Label.Trim();

    private static bool TryGetProperty(
        IReadOnlyDictionary<string, string> properties,
        string key,
        out string? value)
    {
        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(entry.Value))
            {
                value = entry.Value.Trim();

                return true;
            }
        }

        value = null;

        return false;
    }
}
