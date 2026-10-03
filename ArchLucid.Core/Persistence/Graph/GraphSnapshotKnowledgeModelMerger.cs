using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Core.Persistence.Graph;

/// <summary>
///     Merges a κ-projected graph with context-derived nodes/edges. Model nodes and edges win on identity collision.
/// </summary>
public static class GraphSnapshotKnowledgeModelMerger
{
    public static GraphSnapshot Merge(GraphSnapshot contextGraph, GraphSnapshot modelGraph)
    {
        ArgumentNullException.ThrowIfNull(contextGraph);
        ArgumentNullException.ThrowIfNull(modelGraph);

        HashSet<string> modelNodeIds = modelGraph.Nodes
            .Select(static node => NormalizeNodeId(node.NodeId))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        List<GraphNode> mergedNodes = [.. modelGraph.Nodes];
        HashSet<string> mergedNodeIds = new(modelNodeIds, StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode contextNode in contextGraph.Nodes)
        {
            string normalizedNodeId = NormalizeNodeId(contextNode.NodeId);

            if (mergedNodeIds.Contains(normalizedNodeId))
                continue;

            mergedNodeIds.Add(normalizedNodeId);
            mergedNodes.Add(contextNode);
        }

        HashSet<string> edgeKeys = modelGraph.Edges
            .Select(static edge => BuildEdgeKey(edge.FromNodeId, edge.ToNodeId, edge.EdgeType))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        List<GraphEdge> mergedEdges = [.. modelGraph.Edges];

        foreach (GraphEdge contextEdge in contextGraph.Edges)
        {
            string key = BuildEdgeKey(contextEdge.FromNodeId, contextEdge.ToNodeId, contextEdge.EdgeType);

            if (edgeKeys.Contains(key))
                continue;

            edgeKeys.Add(key);
            mergedEdges.Add(contextEdge);
        }

        List<string> warnings = [.. modelGraph.Warnings, .. contextGraph.Warnings];

        return new GraphSnapshot
        {
            GraphSnapshotId = modelGraph.GraphSnapshotId,
            ContextSnapshotId = modelGraph.ContextSnapshotId,
            RunId = modelGraph.RunId,
            CreatedUtc = modelGraph.CreatedUtc,
            Nodes = mergedNodes,
            Edges = mergedEdges,
            Warnings = warnings,
        };
    }

    private static string NormalizeNodeId(string nodeId) => nodeId.Trim();

    private static string BuildEdgeKey(string fromNodeId, string toNodeId, string edgeType)
        => $"{NormalizeNodeId(fromNodeId)}|{NormalizeNodeId(toNodeId)}|{edgeType.Trim()}";
}
