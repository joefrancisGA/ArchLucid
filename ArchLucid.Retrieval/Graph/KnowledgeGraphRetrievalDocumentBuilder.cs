using System.Security.Cryptography;
using System.Text;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Retrieval.Models;

namespace ArchLucid.Retrieval.Graph;

/// <summary>Builds retrieval documents for knowledge-graph nodes (Graph-RAG corpus).</summary>
public static class KnowledgeGraphRetrievalDocumentBuilder
{
    public static IReadOnlyList<RetrievalDocument> BuildFromGraphSnapshot(
        GraphSnapshot snapshot,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        if (snapshot.Nodes is not { Count: > 0 })
            return [];

        List<RetrievalDocument> documents = [];

        foreach (GraphNode node in snapshot.Nodes)
        {
            if (string.IsNullOrWhiteSpace(node.NodeId))
                continue;

            string content = KnowledgeGraphNodeEmbeddingTextComposer.Compose(node);

            if (string.IsNullOrWhiteSpace(content))
                continue;

            string documentId = KnowledgeGraphNodeEmbeddingTextComposer.BuildDocumentId(snapshot.GraphSnapshotId, node.NodeId);

            documents.Add(new RetrievalDocument
            {
                DocumentId = documentId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                RunId = snapshot.RunId,
                ManifestId = null,
                CorpusKind = CorpusKind.KnowledgeGraphNode,
                SourceType = "KnowledgeGraphNode",
                SourceId = node.NodeId,
                Title = node.Label ?? node.NodeId,
                Content = content,
                ContentHash = ComputeContentHash(snapshot.GraphSnapshotId, node.NodeId, content),
                CreatedUtc = snapshot.CreatedUtc,
                DecisionId = null,
                FindingId = null,
            });
        }

        return documents;
    }

    private static string ComputeContentHash(Guid graphSnapshotId, string nodeId, string content)
    {
        string payload = $"{graphSnapshotId:N}|{nodeId}|{content}";
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(payload));

        return Convert.ToHexString(hash);
    }
}
