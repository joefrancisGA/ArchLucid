namespace ArchLucid.Retrieval.Indexing;

/// <summary>
///     Optional metadata surface for in-process indexes (TB-045 startup drift validation).
/// </summary>
public interface IVectorIndexEmbeddingMetadataProvider
{
    /// <summary>Returns metadata when the index contains chunks; otherwise <see langword="null" />.</summary>
    VectorIndexEmbeddingMetadata? GetEmbeddingMetadata();
}
