namespace ArchLucid.Retrieval.Indexing;

/// <summary>Azure Search and other remote indexes without local metadata introspection.</summary>
public sealed class NullVectorIndexEmbeddingMetadataProvider : IVectorIndexEmbeddingMetadataProvider
{
    /// <summary>Singleton for DI when no local metadata provider exists.</summary>
    public static NullVectorIndexEmbeddingMetadataProvider Instance { get; } = new();

    /// <inheritdoc />
    public VectorIndexEmbeddingMetadata? GetEmbeddingMetadata() => null;
}
