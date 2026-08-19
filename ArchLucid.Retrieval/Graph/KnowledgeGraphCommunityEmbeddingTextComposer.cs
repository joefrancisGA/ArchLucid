using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Retrieval.Graph;

/// <summary>Deterministic community-summary embedding text per ADR 0036 / TB-877.</summary>
public static class KnowledgeGraphCommunityEmbeddingTextComposer
{
    public static string Compose(string communityId, string summary, IReadOnlyList<GraphNode> memberNodes)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(communityId);
        ArgumentException.ThrowIfNullOrWhiteSpace(summary);
        ArgumentNullException.ThrowIfNull(memberNodes);

        List<string> memberLabels = memberNodes
            .Select(static node => string.IsNullOrWhiteSpace(node.Label) ? node.NodeId : node.Label.Trim())
            .Where(static label => !string.IsNullOrWhiteSpace(label))
            .Distinct(StringComparer.Ordinal)
            .OrderBy(static label => label, StringComparer.Ordinal)
            .ToList();

        string members = memberLabels.Count == 0 ? "(no labeled members)" : string.Join(", ", memberLabels);

        return $"Knowledge graph community {communityId}. Members: {members}. Summary: {summary.Trim()}";
    }

    public static string BuildDocumentId(Guid graphSnapshotId, string communityId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(communityId);

        return $"graph-{graphSnapshotId:N}-community-{SanitizeCommunityId(communityId)}";
    }

    public static string BuildContentHashSeed(Guid graphSnapshotId, string communityId, IReadOnlyList<string> memberNodeIds)
    {
        string members = string.Join("|", memberNodeIds.OrderBy(static id => id, StringComparer.Ordinal));

        return $"{graphSnapshotId:N}|{communityId}|{members}";
    }

    private static string SanitizeCommunityId(string communityId)
    {
        return communityId.Trim().Replace(" ", "-", StringComparison.Ordinal);
    }
}
