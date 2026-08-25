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
            .Select(static node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        List<GraphNode> mergedNodes = [.. modelGraph.Nodes];

        foreach (GraphNode contextNode in contextGraph.Nodes)
        {
            if (modelNodeIds.Contains(contextNode.NodeId))
                continue;

            mergedNodes.Add(contextNode);
        }

        HashSet<string> edgeKeys = modelGraph.Edges
            .Select(static edge => $"{edge.FromNodeId}|{edge.ToNodeId}|{edge.EdgeType}")
            .ToHashSet(StringComparer.Ordinal);

        List<GraphEdge> mergedEdges = [.. modelGraph.Edges];

        foreach (GraphEdge contextEdge in contextGraph.Edges)
        {
            string key = $"{contextEdge.FromNodeId}|{contextEdge.ToNodeId}|{contextEdge.EdgeType}";

            if (edgeKeys.Contains(key))
                continue;

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
}
