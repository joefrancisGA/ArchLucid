using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Draws one cited line between the visible ends of a stored path whose intermediate
///     network cards are off the diagram. A visible intermediate keeps its own lines.
/// </summary>
internal static class DiagramStoredHiddenPathShortcutApplier
{
    public static void Apply(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);

        if (ast.Nodes.Count == 0 || graph.Edges.Count == 0)
        {
            return;
        }

        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
        HashSet<string> visibleDiagramIds = ast.Nodes
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);
        HashSet<string> visibleGraphNodeIds = graphToDiagramNodeId
            .Where(pair => visibleDiagramIds.Contains(pair.Value))
            .Select(pair => pair.Key)
            .ToHashSet(StringComparer.Ordinal);
        Dictionary<string, string> nodeIdByArmId = BuildNodeIdByArmId(graphNodesById);
        HashSet<string> connectedPairs = BuildConnectedPairs(ast);
        List<(string FromNodeId, string ToNodeId)> adjacency = BuildStoredAdjacency(graph);

        foreach (GraphEdge graphEdge in graph.Edges)
        {
            if (!IsStoredEvidenceEdge(graphEdge))
            {
                continue;
            }

            bool fromVisible = visibleGraphNodeIds.Contains(graphEdge.FromNodeId);
            bool toVisible = visibleGraphNodeIds.Contains(graphEdge.ToNodeId);

            if (fromVisible && toVisible)
            {
                continue;
            }

            List<string> leftEnds = ResolveVisibleDiagramIds(
                graphEdge.FromNodeId,
                graphNodesById,
                visibleGraphNodeIds,
                visibleDiagramIds,
                graphToDiagramNodeId,
                nodeIdByArmId,
                adjacency);
            List<string> rightEnds = ResolveVisibleDiagramIds(
                graphEdge.ToNodeId,
                graphNodesById,
                visibleGraphNodeIds,
                visibleDiagramIds,
                graphToDiagramNodeId,
                nodeIdByArmId,
                adjacency);

            AddShortcuts(ast, connectedPairs, leftEnds, rightEnds, graphEdge);
        }
    }

    private static void AddShortcuts(
        DiagramAst ast,
        HashSet<string> connectedPairs,
        List<string> leftEnds,
        List<string> rightEnds,
        GraphEdge graphEdge)
    {
        foreach (string leftId in leftEnds)
        {
            foreach (string rightId in rightEnds)
            {
                if (string.Equals(leftId, rightId, StringComparison.Ordinal))
                {
                    continue;
                }

                string pairKey = BuildPairKey(leftId, rightId);

                if (!connectedPairs.Add(pairKey))
                {
                    continue;
                }

                ast.Edges.Add(new DiagramEdge
                {
                    FromNodeId = leftId,
                    ToNodeId = rightId,
                    Label = ResolveLabel(graphEdge),
                    ProvenanceKind = string.IsNullOrWhiteSpace(graphEdge.ProvenanceKind)
                        ? ProvenanceKind.DerivedFact.ToString()
                        : graphEdge.ProvenanceKind,
                    InferenceSource = graphEdge.InferenceSource,
                    IsLayoutOnly = false,
                });
            }
        }
    }

    private static List<string> ResolveVisibleDiagramIds(
        string startNodeId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        HashSet<string> visibleGraphNodeIds,
        HashSet<string> visibleDiagramIds,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        IReadOnlyDictionary<string, string> nodeIdByArmId,
        List<(string FromNodeId, string ToNodeId)> adjacency)
    {
        List<string> visibleEnds = [];
        HashSet<string> seenEnds = new(StringComparer.Ordinal);

        if (TryAddVisibleEnd(
                startNodeId,
                graphToDiagramNodeId,
                visibleDiagramIds,
                seenEnds,
                visibleEnds))
        {
            return visibleEnds;
        }

        if (!graphNodesById.TryGetValue(startNodeId, out GraphNode? startNode)
            || !IsHiddenAttachment(startNode, visibleGraphNodeIds))
        {
            return visibleEnds;
        }

        Queue<string> pending = new();
        HashSet<string> visited = new(StringComparer.Ordinal);
        pending.Enqueue(startNodeId);
        visited.Add(startNodeId);

        while (pending.Count > 0)
        {
            string currentId = pending.Dequeue();
            CollectSubnetParent(currentId, graphNodesById, nodeIdByArmId, graphToDiagramNodeId, visibleDiagramIds, seenEnds, visibleEnds);
            ExpandHiddenNeighbors(
                currentId,
                adjacency,
                graphNodesById,
                visibleGraphNodeIds,
                graphToDiagramNodeId,
                visibleDiagramIds,
                seenEnds,
                visibleEnds,
                visited,
                pending);
        }

        return visibleEnds;
    }

    private static void ExpandHiddenNeighbors(
        string currentId,
        List<(string FromNodeId, string ToNodeId)> adjacency,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        HashSet<string> visibleGraphNodeIds,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        HashSet<string> visibleDiagramIds,
        HashSet<string> seenEnds,
        List<string> visibleEnds,
        HashSet<string> visited,
        Queue<string> pending)
    {
        foreach ((string FromNodeId, string ToNodeId) link in adjacency)
        {
            string? neighborId = NeighborOf(link, currentId);

            if (neighborId is null || !visited.Add(neighborId))
            {
                continue;
            }

            if (TryAddVisibleEnd(neighborId, graphToDiagramNodeId, visibleDiagramIds, seenEnds, visibleEnds))
            {
                continue;
            }

            if (!graphNodesById.TryGetValue(neighborId, out GraphNode? neighbor)
                || !IsHiddenAttachment(neighbor, visibleGraphNodeIds))
            {
                continue;
            }

            pending.Enqueue(neighborId);
        }
    }

    private static void CollectSubnetParent(
        string currentId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        IReadOnlyDictionary<string, string> nodeIdByArmId,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        HashSet<string> visibleDiagramIds,
        HashSet<string> seenEnds,
        List<string> visibleEnds)
    {
        if (!graphNodesById.TryGetValue(currentId, out GraphNode? current)
            || !DiagramAstVnetTopologyResolver.IsSubnetNode(current))
        {
            return;
        }

        string? vnetArmId = DiagramAstVnetTopologyResolver.TryResolveVnetIdFromSubnetArmId(
            DiagramAstGraphNodeClassifier.ReadArmId(current));

        if (string.IsNullOrWhiteSpace(vnetArmId))
        {
            return;
        }

        if (!nodeIdByArmId.TryGetValue(ArmResourceIdNormalizer.Normalize(vnetArmId), out string? vnetNodeId))
        {
            return;
        }

        TryAddVisibleEnd(vnetNodeId, graphToDiagramNodeId, visibleDiagramIds, seenEnds, visibleEnds);
    }

    private static bool TryAddVisibleEnd(
        string graphNodeId,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        HashSet<string> visibleDiagramIds,
        HashSet<string> seenEnds,
        List<string> visibleEnds)
    {
        if (!graphToDiagramNodeId.TryGetValue(graphNodeId, out string? diagramId)
            || !visibleDiagramIds.Contains(diagramId))
        {
            return false;
        }

        if (seenEnds.Add(diagramId))
        {
            visibleEnds.Add(diagramId);
        }

        return true;
    }

    private static string? NeighborOf((string FromNodeId, string ToNodeId) link, string currentId)
    {
        if (string.Equals(link.FromNodeId, currentId, StringComparison.Ordinal))
        {
            return link.ToNodeId;
        }

        if (string.Equals(link.ToNodeId, currentId, StringComparison.Ordinal))
        {
            return link.FromNodeId;
        }

        return null;
    }

    private static bool IsHiddenAttachment(GraphNode node, HashSet<string> visibleGraphNodeIds)
    {
        if (visibleGraphNodeIds.Contains(node.NodeId))
        {
            return false;
        }

        if (DiagramNicOwnerResolver.IsNetworkInterfaceNode(node)
            || DiagramAstVnetTopologyResolver.IsSubnetNode(node))
        {
            return true;
        }

        string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);
        string armId = DiagramAstGraphNodeClassifier.ReadArmId(node);

        return ContainsToken(armType, armId, "publicIPAddresses")
            || ContainsToken(armType, armId, "networkSecurityGroups")
            || ContainsToken(armType, armId, "routeTables")
            || IsPrivateEndpoint(armType, armId);
    }

    private static bool IsPrivateEndpoint(string armType, string armId)
    {
        if (armType.Contains("managedPrivateEndpoints", StringComparison.OrdinalIgnoreCase)
            || armId.Contains("/managedPrivateEndpoints/", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return armType.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase)
            || armId.Contains("/privateEndpoints/", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsToken(string armType, string armId, string token)
    {
        if (armType.Contains(token, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return armId.Contains("/" + token + "/", StringComparison.OrdinalIgnoreCase);
    }

    private static string ResolveLabel(GraphEdge graphEdge)
    {
        string label = DiagramEdgeLabelHumanizer.ResolveDisplayLabel(
            graphEdge.Label,
            graphEdge.EdgeType,
            graphEdge.InferenceSource);

        if (string.IsNullOrWhiteSpace(label))
        {
            return "Connected";
        }

        return label;
    }

    private static bool IsStoredEvidenceEdge(GraphEdge edge)
    {
        if (edge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight)
        {
            return false;
        }

        return !string.Equals(
            edge.InferenceSource,
            GraphEdgeInferenceSources.InventoryResourceGroupCollocation,
            StringComparison.OrdinalIgnoreCase);
    }

    private static List<(string FromNodeId, string ToNodeId)> BuildStoredAdjacency(GraphSnapshot graph)
    {
        List<(string FromNodeId, string ToNodeId)> adjacency = [];

        foreach (GraphEdge edge in graph.Edges)
        {
            if (!IsStoredEvidenceEdge(edge))
            {
                continue;
            }

            adjacency.Add((edge.FromNodeId, edge.ToNodeId));
        }

        return adjacency;
    }

    private static Dictionary<string, string> BuildNodeIdByArmId(IReadOnlyDictionary<string, GraphNode> graphNodesById)
    {
        Dictionary<string, string> nodeIdByArmId = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in graphNodesById.Values)
        {
            string armId = ArmResourceIdNormalizer.Normalize(DiagramAstGraphNodeClassifier.ReadArmId(node));

            if (string.IsNullOrWhiteSpace(armId) || nodeIdByArmId.ContainsKey(armId))
            {
                continue;
            }

            nodeIdByArmId[armId] = node.NodeId;
        }

        return nodeIdByArmId;
    }

    private static HashSet<string> BuildConnectedPairs(DiagramAst ast)
    {
        HashSet<string> connectedPairs = new(StringComparer.Ordinal);

        foreach (DiagramEdge edge in ast.Edges)
        {
            if (edge.IsLayoutOnly)
            {
                continue;
            }

            connectedPairs.Add(BuildPairKey(edge.FromNodeId, edge.ToNodeId));
        }

        return connectedPairs;
    }

    private static string BuildPairKey(string leftId, string rightId)
    {
        if (string.CompareOrdinal(leftId, rightId) <= 0)
        {
            return leftId + "|" + rightId;
        }

        return rightId + "|" + leftId;
    }
}
