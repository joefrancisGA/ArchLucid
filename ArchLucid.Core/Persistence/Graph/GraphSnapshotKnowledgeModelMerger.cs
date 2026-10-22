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
        Dictionary<string, GraphNode> mergedNodeByNormalizedId = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode modelNode in modelGraph.Nodes ?? [])
        {
            AddOrCoalesceNode(mergedNodes, mergedNodeByNormalizedId, modelNode);
        }

        foreach (GraphNode contextNode in contextGraph.Nodes ?? [])
        {
            string normalizedNodeId = NormalizeNodeId(contextNode.NodeId);

            if (mergedNodeByNormalizedId.TryGetValue(normalizedNodeId, out GraphNode? existingNode))
            {
                CoalesceGraphNodeFromContext(existingNode, NormalizeNodeIdWhitespace(contextNode));
                continue;
            }

            AddOrCoalesceNode(mergedNodes, mergedNodeByNormalizedId, contextNode);
        }

        Dictionary<string, string> canonicalNodeIdByNormalized = BuildCanonicalNodeIdLookup(mergedNodes);

        List<GraphEdge> mergedEdges = [];
        Dictionary<string, GraphEdge> mergedEdgeByKey = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphEdge modelEdge in modelGraph.Edges ?? [])
        {
            GraphEdge canonicalEdge = CanonicalizeEdgeEndpoints(modelEdge, canonicalNodeIdByNormalized);
            AddOrCoalesceEdge(mergedEdges, mergedEdgeByKey, canonicalEdge);
        }

        foreach (GraphEdge contextEdge in contextGraph.Edges ?? [])
        {
            GraphEdge canonicalEdge = CanonicalizeEdgeEndpoints(contextEdge, canonicalNodeIdByNormalized);
            string key = BuildEdgeKey(canonicalEdge.FromNodeId, canonicalEdge.ToNodeId, canonicalEdge.EdgeType);

            if (mergedEdgeByKey.TryGetValue(key, out GraphEdge? existingEdge))
            {
                CoalesceGraphEdgeFromContext(existingEdge, canonicalEdge);
                continue;
            }

            AddOrCoalesceEdge(mergedEdges, mergedEdgeByKey, canonicalEdge);
        }

        List<string> warnings = [.. modelGraph.Warnings ?? [], .. contextGraph.Warnings ?? []];

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

    private static string NormalizeNodeId(string nodeId) => (nodeId ?? string.Empty).Trim();

    private static void AddOrCoalesceNode(
        List<GraphNode> mergedNodes,
        Dictionary<string, GraphNode> mergedNodeByNormalizedId,
        GraphNode candidate)
    {
        GraphNode node = NormalizeNodeIdWhitespace(candidate);
        string normalizedNodeId = NormalizeNodeId(node.NodeId);

        if (mergedNodeByNormalizedId.TryGetValue(normalizedNodeId, out GraphNode? existing))
        {
            CoalesceGraphNode(existing, node);
            return;
        }

        mergedNodeByNormalizedId[normalizedNodeId] = node;
        mergedNodes.Add(node);
    }

    private static void CoalesceGraphNode(GraphNode existing, GraphNode incoming)
    {
        if (!string.IsNullOrWhiteSpace(incoming.Label))
        {
            existing.Label = incoming.Label;
        }

        if (!string.IsNullOrWhiteSpace(incoming.NodeType))
        {
            existing.NodeType = incoming.NodeType;
        }

        if (!string.IsNullOrWhiteSpace(incoming.Category))
        {
            existing.Category = incoming.Category;
        }
    }

    private static void CoalesceGraphNodeFromContext(GraphNode existing, GraphNode incoming)
    {
        if (string.IsNullOrWhiteSpace(existing.Label) && !string.IsNullOrWhiteSpace(incoming.Label))
        {
            existing.Label = incoming.Label;
        }

        if (string.IsNullOrWhiteSpace(existing.Category) && !string.IsNullOrWhiteSpace(incoming.Category))
        {
            existing.Category = incoming.Category;
        }
    }

    private static void AddOrCoalesceEdge(
        List<GraphEdge> mergedEdges,
        Dictionary<string, GraphEdge> mergedEdgeByKey,
        GraphEdge candidate)
    {
        string key = BuildEdgeKey(candidate.FromNodeId, candidate.ToNodeId, candidate.EdgeType);

        if (mergedEdgeByKey.TryGetValue(key, out GraphEdge? existing))
        {
            CoalesceGraphEdge(existing, candidate);
            return;
        }

        mergedEdgeByKey[key] = candidate;
        mergedEdges.Add(candidate);
    }

    private static void CoalesceGraphEdge(GraphEdge existing, GraphEdge incoming)
    {
        if (!string.IsNullOrWhiteSpace(incoming.Label))
        {
            existing.Label = incoming.Label;
        }

        if (!string.IsNullOrWhiteSpace(incoming.EdgeId))
        {
            existing.EdgeId = incoming.EdgeId;
        }

        existing.Weight = Math.Max(existing.Weight, incoming.Weight);
    }

    private static void CoalesceGraphEdgeFromContext(GraphEdge existing, GraphEdge incoming)
    {
        if (string.IsNullOrWhiteSpace(existing.Label) && !string.IsNullOrWhiteSpace(incoming.Label))
        {
            existing.Label = incoming.Label;
        }

        existing.Weight = Math.Max(existing.Weight, incoming.Weight);
    }

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
            EdgeType = (edge.EdgeType ?? string.Empty).Trim(),
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
        => $"{NormalizeNodeId(fromNodeId)}|{NormalizeNodeId(toNodeId)}|{(edgeType ?? string.Empty).Trim()}";
}
