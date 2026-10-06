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

        List<GraphNode> mergedNodes = [];
        HashSet<string> mergedNodeIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode modelNode in modelGraph.Nodes)
        {
            string normalizedModelNodeId = NormalizeNodeId(modelNode.NodeId);

            if (mergedNodeIds.Contains(normalizedModelNodeId))
                continue;

            mergedNodeIds.Add(normalizedModelNodeId);
            mergedNodes.Add(NormalizeNodeIdWhitespace(modelNode));
        }

        foreach (GraphNode contextNode in contextGraph.Nodes)
        {
            string normalizedNodeId = NormalizeNodeId(contextNode.NodeId);

            if (mergedNodeIds.Contains(normalizedNodeId))
                continue;

            mergedNodeIds.Add(normalizedNodeId);
            mergedNodes.Add(NormalizeNodeIdWhitespace(contextNode));
        }

        Dictionary<string, string> canonicalNodeIdByNormalized = BuildCanonicalNodeIdLookup(mergedNodes);

        List<GraphEdge> mergedEdges = [];
        HashSet<string> edgeKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphEdge modelEdge in modelGraph.Edges)
        {
            GraphEdge canonicalEdge = CanonicalizeEdgeEndpoints(modelEdge, canonicalNodeIdByNormalized);
            string key = BuildEdgeKey(canonicalEdge.FromNodeId, canonicalEdge.ToNodeId, canonicalEdge.EdgeType);

            if (edgeKeys.Contains(key))
                continue;

            edgeKeys.Add(key);
            mergedEdges.Add(canonicalEdge);
        }

        foreach (GraphEdge contextEdge in contextGraph.Edges)
        {
            GraphEdge canonicalEdge = CanonicalizeEdgeEndpoints(contextEdge, canonicalNodeIdByNormalized);
            string key = BuildEdgeKey(canonicalEdge.FromNodeId, canonicalEdge.ToNodeId, canonicalEdge.EdgeType);

            if (edgeKeys.Contains(key))
                continue;

            edgeKeys.Add(key);
            mergedEdges.Add(canonicalEdge);
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

    private static GraphNode NormalizeNodeIdWhitespace(GraphNode node)
    {
        string normalizedNodeId = NormalizeNodeId(node.NodeId);

        if (node.NodeId == normalizedNodeId)
            return node;

        return new GraphNode
        {
            NodeId = normalizedNodeId,
            NodeType = node.NodeType,
            Label = node.Label,
            Category = node.Category,
            SourceType = node.SourceType,
            SourceId = node.SourceId,
            Properties = node.Properties,
            ReasoningTrace = node.ReasoningTrace,
        };
    }

    private static Dictionary<string, string> BuildCanonicalNodeIdLookup(IReadOnlyList<GraphNode> mergedNodes)
    {
        Dictionary<string, string> canonicalNodeIdByNormalized = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in mergedNodes)
        {
            string normalizedNodeId = NormalizeNodeId(node.NodeId);

            canonicalNodeIdByNormalized.TryAdd(normalizedNodeId, node.NodeId);
        }

        return canonicalNodeIdByNormalized;
    }

    private static string ResolveCanonicalEndpoint(
        string nodeId,
        IReadOnlyDictionary<string, string> canonicalNodeIdByNormalized)
    {
        string normalizedNodeId = NormalizeNodeId(nodeId);

        return canonicalNodeIdByNormalized.TryGetValue(normalizedNodeId, out string? canonicalNodeId)
            ? canonicalNodeId
            : normalizedNodeId;
    }

    private static GraphEdge CanonicalizeEdgeEndpoints(
        GraphEdge edge,
        IReadOnlyDictionary<string, string> canonicalNodeIdByNormalized)
    {
        return new GraphEdge
        {
            EdgeId = edge.EdgeId,
            FromNodeId = ResolveCanonicalEndpoint(edge.FromNodeId, canonicalNodeIdByNormalized),
            ToNodeId = ResolveCanonicalEndpoint(edge.ToNodeId, canonicalNodeIdByNormalized),
            EdgeType = edge.EdgeType.Trim(),
            Label = edge.Label,
            Weight = edge.Weight,
            InferenceSource = edge.InferenceSource,
            ProvenanceKind = edge.ProvenanceKind,
            DeclaredConnectionId = edge.DeclaredConnectionId,
            Properties = edge.Properties,
            ReasoningTrace = edge.ReasoningTrace,
        };
    }

    private static string BuildEdgeKey(string fromNodeId, string toNodeId, string edgeType)
        => $"{NormalizeNodeId(fromNodeId)}|{NormalizeNodeId(toNodeId)}|{edgeType.Trim()}";
}
