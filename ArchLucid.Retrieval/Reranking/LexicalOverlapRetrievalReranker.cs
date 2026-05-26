using System.Globalization;

using ArchLucid.Core.Retrieval;

namespace ArchLucid.Retrieval.Reranking;

/// <summary>
///     Development fallback when Azure AI Search semantic ranker is not configured — token overlap between query and chunk text.
/// </summary>
public sealed class LexicalOverlapRetrievalReranker : IRetrievalReranker
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

        if (candidates.Count == 0)
            return Task.FromResult<IReadOnlyList<RetrievalHit>>([]);

        HashSet<string> queryTokens = Tokenize(queryText);
        int take = Math.Clamp(finalTopK, 1, candidates.Count);

        List<RetrievalHit> ranked = candidates
            .Select(hit => (Hit: hit, Overlap: ScoreOverlap(queryTokens, hit)))
            .OrderByDescending(static pair => pair.Overlap)
            .ThenByDescending(static pair => pair.Hit.Score)
            .Take(take)
            .Select(static pair => pair.Hit)
            .ToList();

        return Task.FromResult<IReadOnlyList<RetrievalHit>>(ranked);
    }

    private static double ScoreOverlap(HashSet<string> queryTokens, RetrievalHit hit)
    {
        if (queryTokens.Count == 0)
            return hit.Score;

        HashSet<string> chunkTokens = Tokenize($"{hit.Title} {hit.Text}");

        if (chunkTokens.Count == 0)
            return 0d;

        int overlap = queryTokens.Count(token => chunkTokens.Contains(token));

        return overlap / (double)queryTokens.Count;
    }

    private static HashSet<string> Tokenize(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return [];

        string[] parts = text.Split(
            [' ', '\t', '\r', '\n', '.', ',', ';', ':', '(', ')', '[', ']', '{', '}', '"', '\''],
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        HashSet<string> tokens = new(StringComparer.OrdinalIgnoreCase);

        foreach (string part in parts)
        {
            if (part.Length < 2)
                continue;

            tokens.Add(part.ToLowerInvariant());
        }

        return tokens;
    }
}
