using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;
using InventoryDataFlowStageResolver = ArchLucid.KnowledgeGraph.Inventory.AzureInventoryDataFlowStageResolver;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Keeps VNet placement targets on the Data Flow canvas when a staged app has a cited subnet hop (IDX-02).
/// </summary>
internal static class DataFlowPlacementEndpointIncluder
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

            if (!includedById.TryGetValue(edge.FromNodeId, out GraphNode? fromNode)
                || InventoryDataFlowStageResolver.Resolve(fromNode) is null)
            {
                continue;
            }

            EnsurePlacementTarget(edge.ToNodeId, includedById, graphNodesById, nodes, graph);
        }

        return nodes;
    }

    private static void EnsurePlacementTarget(
        string placementNodeId,
        Dictionary<string, GraphNode> includedById,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        List<GraphNode> nodes,
        GraphSnapshot graph)
    {
        if (!graphNodesById.TryGetValue(placementNodeId, out GraphNode? placementNode))
        {
            return;
        }

        if (DiagramAstVnetTopologyResolver.IsSubnetNode(placementNode))
        {
            string? vnetArmId = DiagramAstVnetTopologyResolver.TryResolveVnetIdFromSubnetArmId(
                DiagramAstGraphNodeClassifier.ReadArmId(placementNode));

            if (!string.IsNullOrWhiteSpace(vnetArmId))
            {
                GraphNode? vnetNode = graph.Nodes.FirstOrDefault(candidate =>
                    string.Equals(
                        DiagramAstGraphNodeClassifier.ReadArmId(candidate),
                        vnetArmId,
                        StringComparison.OrdinalIgnoreCase));

                if (vnetNode is not null)
                {
                    AddIfMissing(vnetNode, includedById, nodes);
                }
            }
        }

        if (AzureInventoryTopologyCategory.IsVirtualNetworkArmType(
                DiagramAstGraphNodeClassifier.ReadArmType(placementNode)))
        {
            AddIfMissing(placementNode, includedById, nodes);
        }
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
        if (string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryResourceGroupCollocation, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return DiagramNicOwnerResolver.IsNicToSubnetEdge(edge)
            || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryAppServiceSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.EdgeType, AzureInventoryRelationshipAssociationTypes.PeToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryPeSubnet, StringComparison.OrdinalIgnoreCase);
    }
}
