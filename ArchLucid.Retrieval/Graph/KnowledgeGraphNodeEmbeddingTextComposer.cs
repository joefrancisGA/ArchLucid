using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Retrieval.Graph;

/// <summary>Deterministic graph-node embedding text per ADR 0036.</summary>
public static class KnowledgeGraphNodeEmbeddingTextComposer
{
    public static string Compose(GraphNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        string nodeType = string.IsNullOrWhiteSpace(node.NodeType) ? "Unknown" : node.NodeType.Trim();
        string label = string.IsNullOrWhiteSpace(node.Label) ? node.NodeId : node.Label.Trim();
        string category = string.IsNullOrWhiteSpace(node.Category) ? string.Empty : node.Category.Trim();
        string reasoning = string.IsNullOrWhiteSpace(node.ReasoningTrace) ? string.Empty : node.ReasoningTrace.Trim();

        if (string.IsNullOrWhiteSpace(category))
            return $"{nodeType}: {label}. {reasoning}".Trim();

        return $"{nodeType}: {label} ({category}). {reasoning}".Trim();
    }

    public static string BuildDocumentId(Guid graphSnapshotId, string nodeId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nodeId);

        return $"graph-{graphSnapshotId:N}-node-{SanitizeNodeId(nodeId)}";
    }

    public static string BuildChunkId(Guid graphSnapshotId, string nodeId)
    {
        return $"{BuildDocumentId(graphSnapshotId, nodeId)}#0";
    }

    public static bool TryParseGraphSnapshotId(string? documentId, out Guid graphSnapshotId)
    {
        graphSnapshotId = Guid.Empty;

        if (string.IsNullOrWhiteSpace(documentId))
            return false;

        ReadOnlySpan<char> span = documentId.AsSpan();

        if (!span.StartsWith("graph-", StringComparison.OrdinalIgnoreCase))
            return false;

        int dash = span.IndexOf("-node-", StringComparison.OrdinalIgnoreCase);

        if (dash < 0)
            return false;

        ReadOnlySpan<char> guidSpan = span.Slice("graph-".Length, dash - "graph-".Length);

        return Guid.TryParse(guidSpan, out graphSnapshotId);
    }

    private static string SanitizeNodeId(string nodeId)
    {
        return nodeId.Trim().Replace(" ", "-");
    }
}
