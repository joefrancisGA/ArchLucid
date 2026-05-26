using ArchLucid.Core.Retrieval;

namespace ArchLucid.Retrieval.Reranking;

/// <summary>Returns candidates in existing score order when reranking is disabled.</summary>
public sealed class PassThroughRetrievalReranker : IRetrievalReranker
{
    /// <inheritdoc />
    public Task<IReadOnlyList<RetrievalHit>> RerankAsync(
        string queryText,
        IReadOnlyList<RetrievalHit> candidates,
        int finalTopK,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(queryText);
        ArgumentNullException.ThrowIfNull(candidates);

        int take = Math.Clamp(finalTopK, 1, candidates.Count);

        if (take == 0 || candidates.Count == 0)
            return Task.FromResult<IReadOnlyList<RetrievalHit>>([]);

        IReadOnlyList<RetrievalHit> result = candidates
            .OrderByDescending(static hit => hit.Score)
            .Take(take)
            .ToList();

        return Task.FromResult(result);
    }
}
