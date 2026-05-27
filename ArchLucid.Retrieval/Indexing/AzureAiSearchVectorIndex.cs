using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Retrieval;

using ArchLucid.Retrieval.Models;

namespace ArchLucid.Retrieval.Indexing;

/// <summary>
///     <see cref="IVectorIndex" /> implementation that delegates to <see cref="IAzureSearchClient" /> (Azure AI Search
///     vector index).
/// </summary>
[ExcludeFromCodeCoverage(Justification =
    "Passthrough adapter; all logic lives in IAzureSearchClient which is tested via its interface.")]
public sealed class AzureAiSearchVectorIndex(IAzureSearchClient client) : IVectorIndex
{
    /// <inheritdoc />
    public Task UpsertChunksAsync(IReadOnlyList<RetrievalChunk> chunks, CancellationToken ct)
    {
        return client.UpsertChunksAsync(chunks, ct);
    }

    /// <inheritdoc />
    public Task RemoveChunksForDocumentAsync(
        string documentId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        RetrievalQuery scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            QueryText = string.Empty,
            TopK = 1
        };

        return client.RemoveChunksForDocumentAsync(documentId, scope, ct);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<RetrievalHit>> SearchAsync(
        RetrievalQuery query,
        float[] queryEmbedding,
        CancellationToken ct)
    {
        return client.SearchAsync(query, queryEmbedding, ct);
    }
}
