using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Inference;

internal static class GraphEdgeInferenceHelpers
{
    internal static GraphEdge CreateEdge(
        string fromNodeId,
        string toNodeId,
        string edgeType,
        string label,
        double weight,
        string inferenceSource)
    {
        return new GraphEdge
        {
            EdgeId = Guid.NewGuid().ToString("N"),
            FromNodeId = fromNodeId.Trim(),
            ToNodeId = toNodeId.Trim(),
            EdgeType = edgeType,
            Label = label,
            Weight = weight,
            InferenceSource = inferenceSource,
            ReasoningTrace = GraphEdgeInferenceReasoningSummaries.ForRule(inferenceSource)
        };
    }

    internal static bool TargetedNodeIdsInclude(HashSet<string> targeted, string nodeId)
    {
        if (targeted.Contains(nodeId))
            return true;

        string trimmedNodeId = nodeId.Trim();
        foreach (string candidate in targeted)
        {
            if (string.Equals(candidate.Trim(), trimmedNodeId, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    internal static List<GraphEdge> Deduplicate(List<GraphEdge> edges)
    {
        return edges
            .GroupBy(
                static edge =>
                    $"{edge.FromNodeId.Trim()}|{edge.ToNodeId.Trim()}|{(edge.EdgeType ?? string.Empty).Trim()}",
                StringComparer.OrdinalIgnoreCase)
            .Select(g => g.OrderByDescending(e => e.Weight).First())
            .ToList();
    }

    internal static HashSet<string>? ParseTargetNodeIds(Dictionary<string, string> properties, string key)
    {
        if (!GraphNodePropertyReader.TryGetPropertyValue(properties, key, out string? raw) || string.IsNullOrWhiteSpace(raw))
            return null;

        string[] parts = raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return parts.Length == 0 ? null : parts.ToHashSet(StringComparer.OrdinalIgnoreCase);
    }
}
