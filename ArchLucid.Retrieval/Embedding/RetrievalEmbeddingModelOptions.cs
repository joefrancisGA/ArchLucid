namespace ArchLucid.Retrieval.Embedding;

/// <summary>
///     Configured embedding model identity used for chunk metadata and startup drift validation (TB-045).
/// </summary>
public sealed class RetrievalEmbeddingModelOptions
{
    public const string SectionName = "Retrieval:EmbeddingModel";

    /// <summary>Azure embedding deployment name or <c>fake-local</c> when using <see cref="FakeEmbeddingService" />.</summary>
    public string ModelId
    {
        get;
        set;
    } = "fake-local";

    /// <summary>
    ///     Expected vector dimension. Unset (0) until host post-configuration: 32 for <c>fake-local</c>,
    ///     1536 for Azure <c>text-embedding-3-small</c> / <c>text-embedding-ada-002</c>.
    /// </summary>
    public int ExpectedDimension
    {
        get;
        set;
    }
}
