namespace ArchLucid.Retrieval.Embedding;

/// <summary>
///     Active embedding deployment identity for index/query drift detection (TB-045 / RAG-V1-007).
/// </summary>
public interface IEmbeddingModelIdentity
{
    /// <summary>Stable model id (Azure deployment name or <c>fake-local</c> for dev).</summary>
    string ModelId
    {
        get;
    }

    /// <summary>Expected dense vector length for all indexed and query embeddings.</summary>
    int ExpectedDimension
    {
        get;
    }
}
