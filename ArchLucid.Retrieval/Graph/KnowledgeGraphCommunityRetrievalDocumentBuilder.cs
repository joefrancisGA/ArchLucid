using System.Security.Cryptography;
using System.Text;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Models;

namespace ArchLucid.Retrieval.Graph;

/// <summary>Builds retrieval documents for knowledge-graph communities (TB-877).</summary>
public static class KnowledgeGraphCommunityRetrievalDocumentBuilder
{
    public static IReadOnlyList<RetrievalDocument> BuildFromCommunities(
        GraphSnapshot snapshot,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        IReadOnlyList<GraphCommunitySummary> communitySummaries)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(communitySummaries);

        if (communitySummaries.Count == 0)
            return [];

        Dictionary<string, GraphNode> nodesById = snapshot.Nodes
            .Where(static node => !string.IsNullOrWhiteSpace(node.NodeId))
            .GroupBy(static node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(static group => group.Key, static group => group.First(), StringComparer.Ordinal);

        List<RetrievalDocument> documents = [];

        foreach (GraphCommunitySummary communitySummary in communitySummaries)
        {
            if (string.IsNullOrWhiteSpace(communitySummary.Summary))
                continue;

            List<GraphNode> memberNodes = communitySummary.MemberNodeIds
                .Where(nodesById.ContainsKey)
                .Select(nodeId => nodesById[nodeId])
                .ToList();

            string content = KnowledgeGraphCommunityEmbeddingTextComposer.Compose(
                communitySummary.CommunityId,
                communitySummary.Summary,
                memberNodes);

            if (string.IsNullOrWhiteSpace(content))
                continue;

            string hashSeed = KnowledgeGraphCommunityEmbeddingTextComposer.BuildContentHashSeed(
                snapshot.GraphSnapshotId,
                communitySummary.CommunityId,
                communitySummary.MemberNodeIds);

            documents.Add(new RetrievalDocument
            {
                DocumentId = KnowledgeGraphCommunityEmbeddingTextComposer.BuildDocumentId(
                    snapshot.GraphSnapshotId,
                    communitySummary.CommunityId),
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                RunId = snapshot.RunId,
                ManifestId = null,
                CorpusKind = CorpusKind.KnowledgeGraphCommunity,
                SourceType = "KnowledgeGraphCommunity",
                SourceId = communitySummary.CommunityId,
                Title = $"Graph community {communitySummary.CommunityId}",
                Content = content,
                ContentHash = ComputeContentHash(hashSeed, communitySummary.Summary),
                CreatedUtc = snapshot.CreatedUtc,
                DecisionId = null,
                FindingId = null,
            });
        }

        return documents;
    }

    private static string ComputeContentHash(string hashSeed, string summary)
    {
        string payload = $"{hashSeed}|{summary}";
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(payload));

        return Convert.ToHexString(hash);
    }
}
