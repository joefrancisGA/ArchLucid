using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Builds cited-hop adjacency for neighborhood / selected / resource-group focus (IDX-12).</summary>
internal static class DiagramHopFocusGraphAdjacencyBuilder
{
    public static bool IsHiddenTransitNode(GraphNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        return DiagramNicOwnerResolver.IsNetworkInterfaceNode(node)
            || NetworkDiagramNodeFilter.IsPrivateEndpointResource(node);
    }

    public static Dictionary<string, HashSet<string>> Build(
        GraphSnapshot graph,
        IReadOnlyCollection<string> eligibleNodeIds)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(eligibleNodeIds);

        Dictionary<string, HashSet<string>> adjacency = eligibleNodeIds.ToDictionary(
            nodeId => nodeId,
            _ => new HashSet<string>(StringComparer.Ordinal),
            StringComparer.Ordinal);

        Dictionary<string, GraphNode> nodesById = graph.Nodes
            .Where(node => eligibleNodeIds.Contains(node.NodeId))
            .ToDictionary(node => node.NodeId, StringComparer.Ordinal);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (edge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight)
            {
                continue;
            }

            if (!InventoryDiagramIndirectRelationshipResolver.IsCitedEdge(edge))
            {
                continue;
            }

            if (!adjacency.ContainsKey(edge.FromNodeId) || !adjacency.ContainsKey(edge.ToNodeId))
            {
                continue;
            }

            AddUndirected(adjacency, edge.FromNodeId, edge.ToNodeId);
        }

        BridgeHiddenTransitNodes(adjacency, nodesById);
        AddParentChildArmLinks(nodesById.Values, adjacency);

        return adjacency;
    }

    public static HashSet<string> CollectReachable(
        Dictionary<string, HashSet<string>> adjacency,
        string seedNodeId,
        int maxDepth)
    {
        ArgumentNullException.ThrowIfNull(adjacency);

        if (!adjacency.ContainsKey(seedNodeId))
        {
            return new HashSet<string>(StringComparer.Ordinal);
        }

        HashSet<string> visited = new(StringComparer.Ordinal) { seedNodeId };
        Queue<(string NodeId, int Depth)> queue = new();
        queue.Enqueue((seedNodeId, 0));

        while (queue.Count > 0)
        {
            (string nodeId, int depth) = queue.Dequeue();

            if (depth >= maxDepth)
            {
                continue;
            }

            if (!adjacency.TryGetValue(nodeId, out HashSet<string>? neighbors))
            {
                continue;
            }

            foreach (string neighbor in neighbors)
            {
                if (visited.Add(neighbor))
                {
                    queue.Enqueue((neighbor, depth + 1));
                }
            }
        }

        return visited;
    }

    private static void BridgeHiddenTransitNodes(
        Dictionary<string, HashSet<string>> adjacency,
        IReadOnlyDictionary<string, GraphNode> nodesById)
    {
        foreach ((string nodeId, GraphNode node) in nodesById)
        {
            if (!IsHiddenTransitNode(node))
            {
                continue;
            }

            if (!adjacency.TryGetValue(nodeId, out HashSet<string>? neighbors) || neighbors.Count < 2)
            {
                continue;
            }

            List<string> neighborList = neighbors.ToList();

            for (int left = 0; left < neighborList.Count; left++)
            {
                for (int right = left + 1; right < neighborList.Count; right++)
                {
                    AddUndirected(adjacency, neighborList[left], neighborList[right]);
                }
            }
        }
    }

    private static void AddUndirected(
        Dictionary<string, HashSet<string>> adjacency,
        string fromNodeId,
        string toNodeId)
    {
        adjacency[fromNodeId].Add(toNodeId);
        adjacency[toNodeId].Add(fromNodeId);
    }

    private static void AddParentChildArmLinks(
        IEnumerable<GraphNode> nodes,
        Dictionary<string, HashSet<string>> adjacency)
    {
        Dictionary<string, string> nodeIdByArmId = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in nodes)
        {
            string armId = DiagramAstGraphNodeClassifier.ReadArmId(node);

            if (string.IsNullOrWhiteSpace(armId) || nodeIdByArmId.ContainsKey(armId))
            {
                continue;
            }

            nodeIdByArmId[armId] = node.NodeId;
        }

        foreach (GraphNode node in nodes)
        {
            if (node.Properties is null
                || !node.Properties.TryGetValue("arm.parentId", out string? parentId)
                || string.IsNullOrWhiteSpace(parentId))
            {
                continue;
            }

            if (!nodeIdByArmId.TryGetValue(parentId, out string? parentNodeId))
            {
                continue;
            }

            if (!adjacency.ContainsKey(parentNodeId) || !adjacency.ContainsKey(node.NodeId))
            {
                continue;
            }

            AddUndirected(adjacency, parentNodeId, node.NodeId);
        }
    }
}
