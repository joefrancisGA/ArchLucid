using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Draws target→VNet <c>in</c> placement when the private-endpoint card is off-canvas but subnet placement
///     was cited on the graph as PE→VNet (missing subnet row).
/// </summary>
internal static class DiagramPrivateEndpointHiddenTargetVnetPlacementEnsurer
{
    public static void Apply(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        DiagramMode mode = DiagramMode.FullSubscription)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);

        if (mode is DiagramMode.DataFlow or DiagramMode.DataArchitecture
            || ast.Nodes.Count == 0
            || graph.Edges.Count == 0)
        {
            return;
        }

        Dictionary<string, GraphNode> graphNodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
        HashSet<string> visibleDiagramIds = ast.Nodes
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);
        HashSet<string> edgeKeys = ast.Edges
            .Where(edge => !edge.IsLayoutOnly)
            .Select(edge => BuildEdgeKey(edge.FromNodeId, edge.ToNodeId, edge.Label))
            .ToHashSet(StringComparer.Ordinal);

        foreach (GraphNode privateEndpointNode in graph.Nodes)
        {
            if (!IsPrivateEndpointGraphNode(privateEndpointNode))
            {
                continue;
            }

            if (graphToDiagramNodeId.ContainsKey(privateEndpointNode.NodeId)
                && visibleDiagramIds.Contains(graphToDiagramNodeId[privateEndpointNode.NodeId]))
            {
                continue;
            }

            List<string> placementVnetDiagramIds = ResolvePlacementVnetDiagramIds(
                privateEndpointNode.NodeId,
                graph,
                graphToDiagramNodeId,
                graphNodesById,
                visibleDiagramIds);

            if (placementVnetDiagramIds.Count == 0)
            {
                continue;
            }

            List<string> targetDiagramIds = ResolveTargetDiagramIds(
                privateEndpointNode.NodeId,
                graph,
                graphToDiagramNodeId,
                graphNodesById,
                visibleDiagramIds);

            foreach (string targetDiagramId in targetDiagramIds)
            {
                foreach (string vnetDiagramId in placementVnetDiagramIds)
                {
                    if (string.Equals(targetDiagramId, vnetDiagramId, StringComparison.Ordinal))
                    {
                        continue;
                    }

                    TryAddInEdge(ast, edgeKeys, visibleDiagramIds, targetDiagramId, vnetDiagramId);
                }
            }
        }
    }

    private static List<string> ResolvePlacementVnetDiagramIds(
        string privateEndpointNodeId,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        HashSet<string> visibleDiagramIds)
    {
        List<string> diagramIds = [];
        HashSet<string> seen = new(StringComparer.Ordinal);

        foreach (GraphEdge graphEdge in graph.Edges)
        {
            if (graphEdge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight
                || !string.Equals(graphEdge.FromNodeId, privateEndpointNodeId, StringComparison.Ordinal)
                || !IsPeSubnetEdge(graphEdge)
                || !graphNodesById.TryGetValue(graphEdge.ToNodeId, out GraphNode? placementNode))
            {
                continue;
            }

            string? vnetDiagramId = ResolveVisibleVnetDiagramId(
                placementNode,
                graphToDiagramNodeId,
                graphNodesById,
                visibleDiagramIds);

            if (string.IsNullOrWhiteSpace(vnetDiagramId) || !seen.Add(vnetDiagramId))
            {
                continue;
            }

            diagramIds.Add(vnetDiagramId);
        }

        return diagramIds;
    }

    private static List<string> ResolveTargetDiagramIds(
        string privateEndpointNodeId,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        HashSet<string> visibleDiagramIds)
    {
        List<string> diagramIds = [];
        HashSet<string> seen = new(StringComparer.Ordinal);

        foreach (GraphEdge graphEdge in graph.Edges)
        {
            if (graphEdge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight
                || !string.Equals(graphEdge.FromNodeId, privateEndpointNodeId, StringComparison.Ordinal)
                || IsPeSubnetEdge(graphEdge)
                || !graphNodesById.TryGetValue(graphEdge.ToNodeId, out GraphNode? targetNode)
                || IsPrivateEndpointGraphNode(targetNode))
            {
                continue;
            }

            if (!IsPrivateEndpointTargetEdge(graphEdge))
            {
                continue;
            }

            foreach (string diagramId in EnumerateVisibleDiagramIdsForTarget(
                         targetNode,
                         graphToDiagramNodeId,
                         visibleDiagramIds,
                         graph.Nodes))
            {
                if (seen.Add(diagramId))
                {
                    diagramIds.Add(diagramId);
                }
            }
        }

        return diagramIds;
    }

    private static IEnumerable<string> EnumerateVisibleDiagramIdsForTarget(
        GraphNode targetNode,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        HashSet<string> visibleDiagramIds,
        IReadOnlyList<GraphNode> graphNodes)
    {
        if (graphToDiagramNodeId.TryGetValue(targetNode.NodeId, out string? exactDiagramId)
            && visibleDiagramIds.Contains(exactDiagramId))
        {
            yield return exactDiagramId;
        }

        string targetArmId = DiagramAstGraphNodeClassifier.ReadArmId(targetNode);

        if (string.IsNullOrWhiteSpace(targetArmId))
        {
            yield break;
        }

        string targetPrefix = targetArmId.TrimEnd('/') + "/";

        foreach (GraphNode candidate in graphNodes)
        {
            string candidateArmId = DiagramAstGraphNodeClassifier.ReadArmId(candidate);

            if (string.IsNullOrWhiteSpace(candidateArmId)
                || !candidateArmId.StartsWith(targetPrefix, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (graphToDiagramNodeId.TryGetValue(candidate.NodeId, out string? childDiagramId)
                && visibleDiagramIds.Contains(childDiagramId))
            {
                yield return childDiagramId;
            }
        }
    }

    private static string? ResolveVisibleVnetDiagramId(
        GraphNode placementNode,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        HashSet<string> visibleDiagramIds)
    {
        if (graphToDiagramNodeId.TryGetValue(placementNode.NodeId, out string? placementDiagramId)
            && visibleDiagramIds.Contains(placementDiagramId))
        {
            if (AzureInventoryTopologyCategory.IsVirtualNetworkArmType(
                    DiagramAstGraphNodeClassifier.ReadArmType(placementNode)))
            {
                return placementDiagramId;
            }
        }

        string armId = DiagramAstGraphNodeClassifier.ReadArmId(placementNode);
        string? vnetArmId = DiagramAstVnetTopologyResolver.TryResolveVnetIdFromSubnetArmId(armId)
            ?? (AzureInventoryTopologyCategory.IsVirtualNetworkArmType(
                    DiagramAstGraphNodeClassifier.ReadArmType(placementNode))
                ? ArmResourceIdNormalizer.Normalize(armId)
                : null);

        if (string.IsNullOrWhiteSpace(vnetArmId))
        {
            return null;
        }

        foreach (KeyValuePair<string, GraphNode> pair in graphNodesById)
        {
            if (!string.Equals(
                    ArmResourceIdNormalizer.Normalize(DiagramAstGraphNodeClassifier.ReadArmId(pair.Value)),
                    ArmResourceIdNormalizer.Normalize(vnetArmId),
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (graphToDiagramNodeId.TryGetValue(pair.Key, out string? vnetDiagramId)
                && visibleDiagramIds.Contains(vnetDiagramId))
            {
                return vnetDiagramId;
            }
        }

        return null;
    }

    private static void TryAddInEdge(
        DiagramAst ast,
        HashSet<string> edgeKeys,
        HashSet<string> visibleDiagramIds,
        string targetDiagramId,
        string vnetDiagramId)
    {
        if (!visibleDiagramIds.Contains(targetDiagramId) || !visibleDiagramIds.Contains(vnetDiagramId))
        {
            return;
        }

        const string label = "in";
        string edgeKey = BuildEdgeKey(targetDiagramId, vnetDiagramId, label);

        if (!edgeKeys.Add(edgeKey))
        {
            return;
        }

        ast.Edges.Add(new DiagramEdge
        {
            FromNodeId = targetDiagramId,
            ToNodeId = vnetDiagramId,
            Label = label,
            InferenceSource = GraphEdgeInferenceSources.InventoryPeSubnet,
            ProvenanceKind = ProvenanceKind.ObservedFact.ToString(),
        });
    }

    private static bool IsPeSubnetEdge(GraphEdge edge)
    {
        return string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.PeToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryPeSubnet, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPrivateEndpointTargetEdge(GraphEdge edge)
    {
        return string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryPrivateEndpoint, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPrivateEndpointGraphNode(GraphNode node)
    {
        string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);
        string armId = DiagramAstGraphNodeClassifier.ReadArmId(node);

        return (!string.IsNullOrWhiteSpace(armType)
                && armType.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase))
            || armId.Contains("/privateEndpoints/", StringComparison.OrdinalIgnoreCase);
    }

    private static string BuildEdgeKey(string fromNodeId, string toNodeId, string? label)
    {
        return $"{fromNodeId}|{toNodeId}|{label ?? string.Empty}";
    }
}
