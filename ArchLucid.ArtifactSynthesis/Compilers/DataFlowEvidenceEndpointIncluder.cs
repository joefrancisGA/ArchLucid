using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using InventoryDataFlowStageResolver = ArchLucid.KnowledgeGraph.Inventory.AzureInventoryDataFlowStageResolver;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Keeps Data Flow family edge endpoints when the stage filter would drop them (SN-PE-03).
/// </summary>
internal static class DataFlowEvidenceEndpointIncluder
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

            if (!DiagramDataFlowEdgeFilter.IncludeEdge(edge))
            {
                continue;
            }

            EnsureStagedEndpoint(edge.FromNodeId, includedById, graphNodesById, nodes);
            EnsureStagedEndpoint(edge.ToNodeId, includedById, graphNodesById, nodes);
        }

        return nodes;
    }

    private static void EnsureStagedEndpoint(
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

        if (InventoryDataFlowStageResolver.Resolve(existing) is null)
        {
            return;
        }

        nodes.Add(existing);
        includedById[nodeId] = existing;
    }
}
