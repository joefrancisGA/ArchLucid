using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Models;

namespace ArchLucid.Host.Core.Services.Ask;

/// <summary>Re-ranks retrieval hits for Ask (prior-manifest boost on historical questions).</summary>
public static class AskRetrievalHitRanker
{
    private const double PriorManifestBoostFactor = 1.25;

    /// <summary>
    ///     Applies a score multiplier to <see cref="CorpusKind.PriorManifest" /> hits when
    ///     <paramref name="boostPriorManifest" /> is true, then returns top-K by score.
    /// </summary>
    public static IReadOnlyList<RetrievalHit> Rank(
        IReadOnlyList<RetrievalHit> hits,
        bool boostPriorManifest,
        int topK)
    {
        ArgumentNullException.ThrowIfNull(hits);

        if (hits.Count == 0)
            return hits;

        int take = Math.Max(1, topK);

        if (!boostPriorManifest)
            return hits.OrderByDescending(static h => h.Score).Take(take).ToList();

        List<RetrievalHit> boosted = hits
            .Select(hit =>
            {
                if (!string.Equals(hit.CorpusKind, nameof(CorpusKind.PriorManifest), StringComparison.Ordinal))
                    return hit;

                return new RetrievalHit
                {
                    ChunkId = hit.ChunkId,
                    DocumentId = hit.DocumentId,
                    CorpusKind = hit.CorpusKind,
                    SourceType = hit.SourceType,
                    SourceId = hit.SourceId,
                    Title = hit.Title,
                    Text = hit.Text,
                    Score = hit.Score * PriorManifestBoostFactor,
                };
            })
            .OrderByDescending(static h => h.Score)
            .Take(take)
            .ToList();

        return boosted;
    }
}
