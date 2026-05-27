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

    /// <summary>Expected vector dimension (32 for fake-local; 1536 typical for Azure text-embedding-ada-002).</summary>
    public int ExpectedDimension
    {
        get;
        set;
    } = 32;
}
