using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Keeps connection-edge endpoints on filtered inventory diagrams when a mode filter would drop them
///     (for example Web App → SQL <c>May access</c> on Executive).
/// </summary>
internal static class InventoryConnectionEndpointIncluder
{
    public static List<GraphNode> Include(GraphSnapshot graph, List<GraphNode> nodes, DiagramMode mode)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(nodes);

        if (mode is not DiagramMode.Executive
            and not DiagramMode.Identity
            and not DiagramMode.Data
            and not DiagramMode.DataArchitecture
            and not DiagramMode.DataFlow)
        {
            return nodes;
        }

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

            if (!InventoryConnectionEndpointEdgeClassifier.ShouldIncludeEdgeOnMode(edge, mode))
            {
                continue;
            }

            EnsureNode(edge.FromNodeId, includedById, graphNodesById, nodes);
            EnsureNode(edge.ToNodeId, includedById, graphNodesById, nodes);
        }

        return nodes;
    }

    private static void EnsureNode(
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

        nodes.Add(existing);
        includedById[nodeId] = existing;
    }
}
