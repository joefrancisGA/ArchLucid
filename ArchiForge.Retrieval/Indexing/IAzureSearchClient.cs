using ArchiForge.Retrieval.Models;

namespace ArchiForge.Retrieval.Indexing;

/// <summary>
/// Azure AI Search seam for vector upsert and hybrid/vector query. Wired when <c>Retrieval:VectorIndex</c> uses search (not <see cref="InMemoryVectorIndex"/>).
/// </summary>
/// <remarks>Placeholder registration: <see cref="NotConfiguredAzureSearchClient"/> throws with configuration guidance.</remarks>
public interface IAzureSearchClient
{
    /// <summary>Uploads or merges chunk documents with embeddings into the search index.</summary>
    Task UpsertChunksAsync(IReadOnlyList<RetrievalChunk> chunks, CancellationToken ct);

    /// <summary>Runs a vector query scoped by <paramref name="query"/> metadata.</summary>
    Task<IReadOnlyList<RetrievalHit>> SearchAsync(
        RetrievalQuery query,
        float[] queryEmbedding,
        CancellationToken ct);
}
