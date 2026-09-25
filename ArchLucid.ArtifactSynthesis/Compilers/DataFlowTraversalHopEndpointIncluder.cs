using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using InventoryDataFlowStageResolver = ArchLucid.KnowledgeGraph.Inventory.AzureInventoryDataFlowStageResolver;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Keeps proven data-flow traversal hop endpoints when the stage filter would drop them (NR-07).
/// </summary>
internal static class DataFlowTraversalHopEndpointIncluder
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

        IReadOnlyList<InventoryDiagramDataFlowTraversalHopLink> traversalLinks =
            InventoryDiagramDataFlowTraversalHopProjector.CollectTraversalLinks(graph);

        foreach (InventoryDiagramDataFlowTraversalHopLink link in traversalLinks)
        {
            EnsureHopEndpoint(link.FromNodeId, includedById, graphNodesById, nodes);
            EnsureHopEndpoint(link.ToNodeId, includedById, graphNodesById, nodes);
        }

        return nodes;
    }

    private static void EnsureHopEndpoint(
        string nodeId,
        Dictionary<string, GraphNode> includedById,
        IReadOnlyDictionary<string, GraphNode> graphNodesById,
        List<GraphNode> nodes)
    {
        if (includedById.ContainsKey(nodeId))
        {
            return;
        }

        if (!graphNodesById.TryGetValue(nodeId, out GraphNode? existing))
        {
            return;
        }

        if (!InventoryDiagramDataFlowTraversalHopClassifier.IsTraversalHopNode(existing)
            && InventoryDataFlowStageResolver.Resolve(existing) is null)
        {
            return;
        }

        nodes.Add(existing);
        includedById[nodeId] = existing;
    }
}
