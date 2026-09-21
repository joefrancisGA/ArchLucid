using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Uses hidden NIC and private-endpoint hops to draw edges between remaining canvas nodes.
///     The hop resources stay off-canvas unless the caller opted them in.
/// </summary>
internal static class DiagramCollapsedAttachmentEdgeLifter
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
        Dictionary<string, string> nicNodeIdToOwnerNodeId =
            DiagramNicOwnerResolver.BuildNicNodeIdToOwnerNodeIdMap(graph.Edges, graph.Nodes);
        HashSet<string> visibleEdgeKeys = ast.Edges
            .Where(edge => !edge.IsLayoutOnly)
            .Select(edge => BuildEdgeKey(edge.FromNodeId, edge.ToNodeId, edge.Label))
            .ToHashSet(StringComparer.Ordinal);

        LiftHiddenNicEndpoints(
            ast,
            graph,
            graphToDiagramNodeId,
            graphNodesById,
            nicNodeIdToOwnerNodeId,
            visibleDiagramIds,
            visibleEdgeKeys);
        LiftHiddenPrivateEndpointPlacements(
            ast,
            graph,
            graphToDiagramNodeId,
            graphNodesById,
            nicNodeIdToOwnerNodeId,
            visibleDiagramIds,
            visibleEdgeKeys);
    }

    private static void LiftHiddenNicEndpoints(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        IReadOnlyDictionary<string, string> nicNodeIdToOwnerNodeId,
        HashSet<string> visibleDiagramIds,
        HashSet<string> visibleEdgeKeys)
    {
        foreach (GraphEdge graphEdge in graph.Edges)
        {
            if (graphEdge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight)
            {
                continue;
            }

            bool fromVisible = TryGetVisibleDiagramId(
                graphEdge.FromNodeId,
                graphToDiagramNodeId,
                visibleDiagramIds,
                out string? fromDiagramId);
            bool toVisible = TryGetVisibleDiagramId(
                graphEdge.ToNodeId,
                graphToDiagramNodeId,
                visibleDiagramIds,
                out string? toDiagramId);

            if (fromVisible && toVisible)
            {
                continue;
            }

            string? liftedFrom = LiftHiddenEndpoint(
                graphEdge.FromNodeId,
                graphToDiagramNodeId,
                graphNodesById,
                nicNodeIdToOwnerNodeId,
                visibleDiagramIds);
            string? liftedTo = LiftHiddenEndpoint(
                graphEdge.ToNodeId,
                graphToDiagramNodeId,
                graphNodesById,
                nicNodeIdToOwnerNodeId,
                visibleDiagramIds);

            if (string.IsNullOrWhiteSpace(liftedFrom) || string.IsNullOrWhiteSpace(liftedTo))
            {
                continue;
            }

            if (string.Equals(liftedFrom, liftedTo, StringComparison.Ordinal))
            {
                continue;
            }

            TryAddVisibleEdge(
                ast,
                visibleEdgeKeys,
                visibleDiagramIds,
                liftedFrom,
                liftedTo,
                ResolveLiftedLabel(graphEdge, graphNodesById, graphEdge.ToNodeId),
                graphEdge);
        }
    }

    private static void LiftHiddenPrivateEndpointPlacements(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        IReadOnlyDictionary<string, string> nicNodeIdToOwnerNodeId,
        HashSet<string> visibleDiagramIds,
        HashSet<string> visibleEdgeKeys)
    {
        foreach (GraphNode privateEndpointNode in graph.Nodes)
        {
            if (!IsPrivateEndpointNode(privateEndpointNode))
            {
                continue;
            }

            if (TryGetVisibleDiagramId(
                    privateEndpointNode.NodeId,
                    graphToDiagramNodeId,
                    visibleDiagramIds,
                    out _))
            {
                continue;
            }

            List<string> targetDiagramIds = ResolvePrivateEndpointTargetDiagramIds(
                privateEndpointNode.NodeId,
                graph,
                graphToDiagramNodeId,
                graphNodesById,
                visibleDiagramIds);
            List<string> placementDiagramIds = ResolvePrivateEndpointPlacementDiagramIds(
                privateEndpointNode.NodeId,
                graph,
                graphToDiagramNodeId,
                graphNodesById,
                nicNodeIdToOwnerNodeId,
                visibleDiagramIds);

            foreach (string targetDiagramId in targetDiagramIds)
            {
                foreach (string placementDiagramId in placementDiagramIds)
                {
                    if (string.Equals(targetDiagramId, placementDiagramId, StringComparison.Ordinal))
                    {
                        continue;
                    }

                    GraphEdge sourceEdge = new()
                    {
                        EdgeType = AzureInventoryRelationshipAssociationTypes.PeToSubnet,
                        Label = AzureInventoryRelationshipAssociationTypes.PeToSubnet,
                        InferenceSource = GraphEdgeInferenceSources.InventoryPeSubnet,
                        ProvenanceKind = ProvenanceKind.DerivedFact.ToString(),
                    };

                    TryAddVisibleEdge(
                        ast,
                        visibleEdgeKeys,
                        visibleDiagramIds,
                        targetDiagramId,
                        placementDiagramId,
                        "in",
                        sourceEdge);
                }
            }
        }
    }

    private static List<string> ResolvePrivateEndpointTargetDiagramIds(
        string privateEndpointNodeId,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        HashSet<string> visibleDiagramIds)
    {
        List<string> targetDiagramIds = [];
        HashSet<string> seen = new(StringComparer.Ordinal);

        foreach (GraphEdge graphEdge in graph.Edges)
        {
            if (graphEdge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight)
            {
                continue;
            }

            if (!string.Equals(graphEdge.FromNodeId, privateEndpointNodeId, StringComparison.Ordinal))
            {
                continue;
            }

            if (!graphNodesById.TryGetValue(graphEdge.ToNodeId, out GraphNode? toNode))
            {
                continue;
            }

            if (IsNicOrSubnetOrPrivateEndpointNode(toNode) || IsPrivateEndpointAttachmentEdge(graphEdge))
            {
                continue;
            }

            if (!IsPrivateEndpointTargetEdge(graphEdge))
            {
                continue;
            }

            foreach (string diagramId in EnumerateVisibleDiagramIdsForTarget(
                         toNode,
                         graphToDiagramNodeId,
                         visibleDiagramIds,
                         graph.Nodes))
            {
                if (seen.Add(diagramId))
                {
                    targetDiagramIds.Add(diagramId);
                }
            }
        }

        return targetDiagramIds;
    }

    private static List<string> ResolvePrivateEndpointPlacementDiagramIds(
        string privateEndpointNodeId,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        IReadOnlyDictionary<string, string> nicNodeIdToOwnerNodeId,
        HashSet<string> visibleDiagramIds)
    {
        List<string> placementDiagramIds = [];
        HashSet<string> seen = new(StringComparer.Ordinal);

        foreach (GraphEdge graphEdge in graph.Edges)
        {
            if (graphEdge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight)
            {
                continue;
            }

            if (!string.Equals(graphEdge.FromNodeId, privateEndpointNodeId, StringComparison.Ordinal))
            {
                continue;
            }

            if (!graphNodesById.TryGetValue(graphEdge.ToNodeId, out GraphNode? toNode))
            {
                continue;
            }

            if (IsPeToSubnetEdge(graphEdge) || DiagramAstVnetTopologyResolver.IsSubnetNode(toNode))
            {
                string? placementId = LiftHiddenEndpoint(
                    graphEdge.ToNodeId,
                    graphToDiagramNodeId,
                    graphNodesById,
                    nicNodeIdToOwnerNodeId,
                    visibleDiagramIds);

                if (!string.IsNullOrWhiteSpace(placementId) && seen.Add(placementId))
                {
                    placementDiagramIds.Add(placementId);
                }

                continue;
            }

            if (!IsPeToNicEdge(graphEdge) && !DiagramNicOwnerResolver.IsNetworkInterfaceNode(toNode))
            {
                continue;
            }

            foreach (GraphEdge nicEdge in graph.Edges)
            {
                if (nicEdge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight)
                {
                    continue;
                }

                if (!string.Equals(nicEdge.FromNodeId, graphEdge.ToNodeId, StringComparison.Ordinal))
                {
                    continue;
                }

                if (!DiagramNicOwnerResolver.IsNicToSubnetEdge(nicEdge))
                {
                    continue;
                }

                if (!graphNodesById.TryGetValue(nicEdge.ToNodeId, out GraphNode? subnetNode)
                    || !DiagramAstVnetTopologyResolver.IsSubnetNode(subnetNode))
                {
                    continue;
                }

                string? placementId = LiftHiddenEndpoint(
                    nicEdge.ToNodeId,
                    graphToDiagramNodeId,
                    graphNodesById,
                    nicNodeIdToOwnerNodeId,
                    visibleDiagramIds);

                if (!string.IsNullOrWhiteSpace(placementId) && seen.Add(placementId))
                {
                    placementDiagramIds.Add(placementId);
                }
            }
        }

        return placementDiagramIds;
    }

    private static IEnumerable<string> EnumerateVisibleDiagramIdsForTarget(
        GraphNode targetNode,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        HashSet<string> visibleDiagramIds,
        IReadOnlyList<GraphNode> graphNodes)
    {
        if (TryGetVisibleDiagramId(targetNode.NodeId, graphToDiagramNodeId, visibleDiagramIds, out string? exactId)
            && !string.IsNullOrWhiteSpace(exactId))
        {
            yield return exactId;
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

            if (string.IsNullOrWhiteSpace(candidateArmId))
            {
                continue;
            }

            bool isChild = candidateArmId.StartsWith(targetPrefix, StringComparison.OrdinalIgnoreCase);

            if (!isChild)
            {
                continue;
            }

            if (TryGetVisibleDiagramId(
                    candidate.NodeId,
                    graphToDiagramNodeId,
                    visibleDiagramIds,
                    out string? childDiagramId)
                && !string.IsNullOrWhiteSpace(childDiagramId))
            {
                yield return childDiagramId;
            }
        }
    }

    private static string? LiftHiddenEndpoint(
        string graphNodeId,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        IReadOnlyDictionary<string, string> nicNodeIdToOwnerNodeId,
        HashSet<string> visibleDiagramIds)
    {
        if (TryGetVisibleDiagramId(graphNodeId, graphToDiagramNodeId, visibleDiagramIds, out string? visibleId))
        {
            return visibleId;
        }

        if (nicNodeIdToOwnerNodeId.TryGetValue(graphNodeId, out string? ownerNodeId)
            && TryGetVisibleDiagramId(ownerNodeId, graphToDiagramNodeId, visibleDiagramIds, out string? ownerDiagramId))
        {
            return ownerDiagramId;
        }

        if (!graphNodesById.TryGetValue(graphNodeId, out GraphNode? graphNode))
        {
            return null;
        }

        if (!DiagramAstVnetTopologyResolver.IsSubnetNode(graphNode))
        {
            return null;
        }

        string? vnetArmId = DiagramAstVnetTopologyResolver.TryResolveVnetIdFromSubnetArmId(
            DiagramAstGraphNodeClassifier.ReadArmId(graphNode));

        if (string.IsNullOrWhiteSpace(vnetArmId))
        {
            return null;
        }

        foreach (KeyValuePair<string, GraphNode> pair in graphNodesById)
        {
            if (!string.Equals(
                    DiagramAstGraphNodeClassifier.ReadArmId(pair.Value),
                    vnetArmId,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (TryGetVisibleDiagramId(pair.Key, graphToDiagramNodeId, visibleDiagramIds, out string? vnetDiagramId))
            {
                return vnetDiagramId;
            }
        }

        return null;
    }

    private static string ResolveLiftedLabel(
        GraphEdge graphEdge,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        string originalToGraphNodeId)
    {
        if (graphNodesById.TryGetValue(originalToGraphNodeId, out GraphNode? originalTo)
            && (DiagramAstVnetTopologyResolver.IsSubnetNode(originalTo)
                || AzureInventoryTopologyCategory.IsVirtualNetworkArmType(
                    DiagramAstGraphNodeClassifier.ReadArmType(originalTo))))
        {
            return "in";
        }

        return DiagramEdgeLabelHumanizer.ResolveDisplayLabel(
            graphEdge.Label,
            graphEdge.EdgeType,
            graphEdge.InferenceSource);
    }

    private static void TryAddVisibleEdge(
        DiagramAst ast,
        HashSet<string> visibleEdgeKeys,
        HashSet<string> visibleDiagramIds,
        string fromDiagramId,
        string toDiagramId,
        string label,
        GraphEdge sourceEdge)
    {
        if (!visibleDiagramIds.Contains(fromDiagramId) || !visibleDiagramIds.Contains(toDiagramId))
        {
            return;
        }

        string edgeKey = BuildEdgeKey(fromDiagramId, toDiagramId, label);

        if (!visibleEdgeKeys.Add(edgeKey))
        {
            return;
        }

        ast.Edges.Add(new DiagramEdge
        {
            FromNodeId = fromDiagramId,
            ToNodeId = toDiagramId,
            Label = label,
            ProvenanceKind = string.IsNullOrWhiteSpace(sourceEdge.ProvenanceKind)
                ? ProvenanceKind.DerivedFact.ToString()
                : sourceEdge.ProvenanceKind,
            InferenceSource = sourceEdge.InferenceSource,
        });
    }

    private static bool TryGetVisibleDiagramId(
        string graphNodeId,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        HashSet<string> visibleDiagramIds,
        out string? diagramId)
    {
        diagramId = null;

        if (!graphToDiagramNodeId.TryGetValue(graphNodeId, out string? mappedId))
        {
            return false;
        }

        if (!visibleDiagramIds.Contains(mappedId))
        {
            return false;
        }

        diagramId = mappedId;

        return true;
    }

    private static bool IsPrivateEndpointNode(GraphNode node)
    {
        string armType = DiagramAstGraphNodeClassifier.ReadArmType(node);
        string armId = DiagramAstGraphNodeClassifier.ReadArmId(node);

        if (!string.IsNullOrWhiteSpace(armType)
            && armType.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return armId.Contains("/privateEndpoints/", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsNicOrSubnetOrPrivateEndpointNode(GraphNode node)
    {
        return DiagramNicOwnerResolver.IsNetworkInterfaceNode(node)
            || DiagramAstVnetTopologyResolver.IsSubnetNode(node)
            || IsPrivateEndpointNode(node);
    }

    private static bool IsPrivateEndpointTargetEdge(GraphEdge edge)
    {
        return string.Equals(
                   edge.InferenceSource,
                   GraphEdgeInferenceSources.InventoryPrivateEndpoint,
                   StringComparison.OrdinalIgnoreCase)
            || string.Equals(
                   edge.EdgeType,
                   AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget,
                   StringComparison.OrdinalIgnoreCase)
            || string.Equals(
                   edge.Label,
                   AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget,
                   StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, GraphEdgeTypes.ConnectsTo, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPrivateEndpointAttachmentEdge(GraphEdge edge)
    {
        return IsPeToSubnetEdge(edge) || IsPeToNicEdge(edge);
    }

    private static bool IsPeToSubnetEdge(GraphEdge edge)
    {
        return string.Equals(
                   edge.EdgeType,
                   AzureInventoryRelationshipAssociationTypes.PeToSubnet,
                   StringComparison.OrdinalIgnoreCase)
            || string.Equals(
                   edge.Label,
                   AzureInventoryRelationshipAssociationTypes.PeToSubnet,
                   StringComparison.OrdinalIgnoreCase)
            || string.Equals(
                   edge.InferenceSource,
                   GraphEdgeInferenceSources.InventoryPeSubnet,
                   StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPeToNicEdge(GraphEdge edge)
    {
        return string.Equals(
                   edge.EdgeType,
                   AzureInventoryRelationshipAssociationTypes.PeToNic,
                   StringComparison.OrdinalIgnoreCase)
            || string.Equals(
                   edge.Label,
                   AzureInventoryRelationshipAssociationTypes.PeToNic,
                   StringComparison.OrdinalIgnoreCase)
            || string.Equals(
                   edge.InferenceSource,
                   GraphEdgeInferenceSources.InventoryPeNic,
                   StringComparison.OrdinalIgnoreCase);
    }

    private static string BuildEdgeKey(string fromNodeId, string toNodeId, string? label)
    {
        return $"{fromNodeId}|{toNodeId}|{label ?? string.Empty}";
    }
}
