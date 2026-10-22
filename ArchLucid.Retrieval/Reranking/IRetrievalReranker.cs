using ArchLucid.Core.Retrieval;

namespace ArchLucid.Retrieval.Reranking;

/// <summary>Contextual rerank over vector retrieval candidates (Improvement #23).</summary>
public interface IRetrievalReranker
{
    /// <summary>
    ///     Re-orders <paramref name="candidates" /> for <paramref name="queryText" /> and returns at most
    ///     <paramref name="finalTopK" /> hits.
    /// </summary>
    Task<IReadOnlyList<RetrievalHit>> RerankAsync(
        string queryText,
        IReadOnlyList<RetrievalHit> candidates,
        int finalTopK,
        CancellationToken cancellationToken);
}
