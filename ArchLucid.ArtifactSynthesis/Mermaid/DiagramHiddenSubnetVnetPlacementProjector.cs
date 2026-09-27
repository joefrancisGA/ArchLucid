using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

/// <summary>
/// Projects subnet placement onto a surviving VNet before subnet nodes are peeled from an inventory diagram.
/// </summary>
internal static class DiagramHiddenSubnetVnetPlacementProjector
{
    public static IReadOnlyList<GraphEdge> Project(
        GraphSnapshot graph,
        IReadOnlySet<string> excludedArmResourceTypes)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(excludedArmResourceTypes);

        if (!excludedArmResourceTypes.Any(AzureInventoryTopologyCategory.IsSubnetArmType))
        {
            return [];
        }

        Dictionary<string, GraphNode> nodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);
        Dictionary<string, string> nodeIdByArmId = nodesById.Values
            .Select(node => (Node: node, ArmId: DiagramAstGraphNodeClassifier.ReadArmId(node)))
            .Where(pair => !string.IsNullOrWhiteSpace(pair.ArmId))
            .GroupBy(pair => ArmResourceIdNormalizer.Normalize(pair.ArmId), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.First().Node.NodeId, StringComparer.OrdinalIgnoreCase);
        Dictionary<string, string> nicOwnerByNodeId =
            DiagramNicOwnerResolver.BuildNicNodeIdToOwnerNodeIdMap(graph.Edges, graph.Nodes);
        HashSet<string> edgeKeys = graph.Edges
            .Select(BuildEdgeKey)
            .ToHashSet(StringComparer.Ordinal);
        List<GraphEdge> projectedEdges = [];

        foreach (GraphEdge placementEdge in graph.Edges.ToList())
        {
            if (placementEdge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight
                || !IsSubnetPlacementEdge(placementEdge)
                || !nodesById.TryGetValue(placementEdge.ToNodeId, out GraphNode? subnet)
                || !AzureInventoryTopologyCategory.IsSubnetArmType(
                    DiagramAstGraphNodeClassifier.ReadArmType(subnet)))
            {
                continue;
            }

            string subnetArmId = DiagramAstGraphNodeClassifier.ReadArmId(subnet);
            string? vnetArmId = DiagramAstVnetTopologyResolver.TryResolveVnetIdFromSubnetArmId(subnetArmId);
            if (string.IsNullOrWhiteSpace(vnetArmId))
            {
                continue;
            }

            if (!nodeIdByArmId.TryGetValue(
                    ArmResourceIdNormalizer.Normalize(vnetArmId),
                    out string? vnetNodeId)
                || string.IsNullOrWhiteSpace(vnetNodeId))
            {
                continue;
            }

            if (!nodesById.TryGetValue(vnetNodeId, out GraphNode? vnet)
                || IsExcluded(vnet, excludedArmResourceTypes))
            {
                continue;
            }

            if (!nodesById.TryGetValue(placementEdge.FromNodeId, out GraphNode? placedNode))
            {
                continue;
            }

            if (nicOwnerByNodeId.TryGetValue(placedNode.NodeId, out string? ownerNodeId)
                && nodesById.TryGetValue(ownerNodeId, out GraphNode? ownerNode))
            {
                placedNode = ownerNode;
            }

            if (IsExcluded(placedNode, excludedArmResourceTypes)
                || !string.Equals(
                    DiagramAstGraphNodeClassifier.ReadResourceGroup(placedNode),
                    DiagramAstGraphNodeClassifier.ReadResourceGroup(vnet),
                    StringComparison.OrdinalIgnoreCase)
                || IsCollocation(placementEdge))
            {
                continue;
            }

            string edgeKey = $"{placedNode.NodeId}|{vnet.NodeId}|{GraphEdgeTypes.ConnectsTo}";
            if (!edgeKeys.Add(edgeKey))
            {
                continue;
            }

            projectedEdges.Add(new GraphEdge
            {
                EdgeId = $"edge-{edgeKey}",
                FromNodeId = placedNode.NodeId,
                ToNodeId = vnet.NodeId,
                EdgeType = GraphEdgeTypes.ConnectsTo,
                Label = "in",
                Weight = 1.0d,
                InferenceSource = GraphEdgeInferenceSources.InventoryHiddenSubnetVnetPlacement,
                ProvenanceKind = ProvenanceKind.DerivedFact.ToString(),
            });
        }

        return projectedEdges;
    }

    private static bool IsExcluded(
        GraphNode node,
        IReadOnlySet<string> excludedArmResourceTypes)
    {
        return excludedArmResourceTypes.Contains(
            DiagramAstGraphNodeClassifier.ReadArmType(node));
    }

    private static bool IsCollocation(GraphEdge edge)
    {
        return string.Equals(
            edge.InferenceSource,
            GraphEdgeInferenceSources.InventoryResourceGroupCollocation,
            StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsSubnetPlacementEdge(GraphEdge edge)
    {
        return string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.NicToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.PeToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryNicSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryPeSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryAppServiceSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.Label, AzureInventoryRelationshipAssociationTypes.NicToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.Label, AzureInventoryRelationshipAssociationTypes.PeToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.Label, AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet, StringComparison.OrdinalIgnoreCase);
    }

    private static string BuildEdgeKey(GraphEdge edge)
    {
        return $"{edge.FromNodeId}|{edge.ToNodeId}|{edge.EdgeType}";
    }
}
