using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Keeps workloads on the Network canvas when they have a cited hop into a visible subnet or VNet (IDX-05).
/// </summary>
internal static class NetworkDiagramPlacementWorkloadIncluder
{
    public static List<GraphNode> Include(GraphSnapshot graph, List<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(nodes);

        Dictionary<string, GraphNode> includedById = nodes.ToDictionary(
            node => node.NodeId,
            StringComparer.Ordinal);
        Dictionary<string, GraphNode> graphNodesById = graph.Nodes.ToDictionary(
            node => node.NodeId,
            StringComparer.Ordinal);

        Dictionary<string, string> nicNodeIdToOwnerNodeId =
            DiagramNicOwnerResolver.BuildNicNodeIdToOwnerNodeIdMap(graph.Edges, graph.Nodes);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (edge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight)
            {
                continue;
            }

            if (!IsCitedPlacementEdge(edge))
            {
                continue;
            }

            if (!includedById.ContainsKey(edge.ToNodeId))
            {
                continue;
            }

            if (!graphNodesById.TryGetValue(edge.FromNodeId, out GraphNode? fromNode))
            {
                continue;
            }

            AddIfMissing(fromNode, includedById, nodes);

            if (DiagramAstVnetTopologyResolver.IsSubnetNode(graphNodesById[edge.ToNodeId])
                && nicNodeIdToOwnerNodeId.TryGetValue(edge.FromNodeId, out string? ownerNodeId)
                && graphNodesById.TryGetValue(ownerNodeId, out GraphNode? ownerNode))
            {
                AddIfMissing(ownerNode, includedById, nodes);
            }
        }

        return nodes
            .OrderBy(DiagramAstGraphNodeClassifier.ReadArmId, StringComparer.Ordinal)
            .ToList();
    }

    private static void AddIfMissing(
        GraphNode node,
        Dictionary<string, GraphNode> includedById,
        List<GraphNode> nodes)
    {
        if (includedById.ContainsKey(node.NodeId))
        {
            return;
        }

        nodes.Add(node);
        includedById[node.NodeId] = node;
    }

    private static bool IsCitedPlacementEdge(GraphEdge edge)
    {
        if (string.Equals(
                edge.InferenceSource,
                GraphEdgeInferenceSources.InventoryResourceGroupCollocation,
                StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        string source = edge.InferenceSource ?? string.Empty;

        return string.Equals(source, AzureInventoryRelationshipAssociationTypes.NicToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(source, AzureInventoryRelationshipAssociationTypes.PeToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(source, AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(source, GraphEdgeInferenceSources.InventoryNicSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(source, GraphEdgeInferenceSources.InventoryPeSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(source, GraphEdgeInferenceSources.InventoryAppServiceSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(source, GraphEdgeInferenceSources.InventoryLayoutVmVnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(source, GraphEdgeInferenceSources.InventoryHiddenSubnetVnetPlacement, StringComparison.OrdinalIgnoreCase)
            || DiagramNicOwnerResolver.IsNicToSubnetEdge(edge)
            || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.PeToSubnet, StringComparison.OrdinalIgnoreCase);
    }
}
