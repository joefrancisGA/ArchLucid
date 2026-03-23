namespace ArchiForge.Retrieval.Embedding;

/// <summary>
/// Low-level embeddings seam (typically Azure OpenAI <see cref="AzureOpenAiEmbeddingClient"/>). Consumed by <see cref="AzureOpenAiEmbeddingService"/>.
/// </summary>
public interface IOpenAiEmbeddingClient
{
    /// <summary>Single-text embedding vector.</summary>
    Task<float[]> EmbedAsync(string text, CancellationToken ct);

    /// <summary>Batched embeddings in input order (empty list returns empty).</summary>
    Task<IReadOnlyList<float[]>> EmbedManyAsync(IReadOnlyList<string> texts, CancellationToken ct);
}
