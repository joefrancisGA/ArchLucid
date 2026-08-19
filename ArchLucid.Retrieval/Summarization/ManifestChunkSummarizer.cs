using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Chunking;
using ArchLucid.Retrieval.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Summarization;

/// <inheritdoc cref="IManifestChunkSummarizer" />
public sealed class ManifestChunkSummarizer(
    IManifestChunkSummaryCompletionClient summaryCompletionClient,
    IOptionsMonitor<ManifestChunkSummarizationOptions> optionsMonitor) : IManifestChunkSummarizer
{
    private readonly IManifestChunkSummaryCompletionClient _summaryCompletionClient =
        summaryCompletionClient ?? throw new ArgumentNullException(nameof(summaryCompletionClient));

    private readonly IOptionsMonitor<ManifestChunkSummarizationOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    /// <inheritdoc />
    public async Task<IReadOnlyList<RetrievalHit>> MaybeSummarizeAsync(
        IReadOnlyList<RetrievalHit> hits,
        CancellationToken cancellationToken)
    {
        if (hits is null || hits.Count == 0)
            return hits ?? [];

        ManifestChunkSummarizationOptions options = _optionsMonitor.CurrentValue;

        if (!options.Enabled || options.SafeTokenLimit < 1)
            return hits;

        int estimatedTokens = EstimateTotalTokens(hits);

        if (estimatedTokens <= options.SafeTokenLimit)
            return hits;

        List<RetrievalHit> mutableHits = hits.ToList();
        List<RetrievalHit> remainingCandidates = mutableHits
            .Where(static hit => IsManifestCorpus(hit.CorpusKind))
            .OrderBy(static hit => hit.Score)
            .ToList();

        if (remainingCandidates.Count == 0)
            return hits;

        int maxConcurrent = Math.Clamp(options.MaxConcurrentSummaries, 1, 32);

        // Select a prefix needed to clear the overage (optimistic: treat summarized text as 0 tokens),
        // then parallelize that prefix. Repeat if summaries still leave the batch over budget.
        while (remainingCandidates.Count > 0)
        {
            estimatedTokens = EstimateTotalTokens(mutableHits);

            if (estimatedTokens <= options.SafeTokenLimit)
                break;

            IReadOnlyList<RetrievalHit> prefix =
                SelectSummarizationPrefix(remainingCandidates, estimatedTokens, options.SafeTokenLimit);

            if (prefix.Count == 0)
                break;

            Dictionary<string, string> summariesByChunkId = new(StringComparer.Ordinal);

            await BoundedBatchParallelism.ForEachAsync(
                prefix,
                maxConcurrent,
                async (candidate, ct) =>
                {
                    string summary = await _summaryCompletionClient
                        .SummarizeChunkAsync(candidate.Text, ct)
                        .ConfigureAwait(false);

                    lock (summariesByChunkId)
                    {
                        summariesByChunkId[candidate.ChunkId] = summary;
                    }
                },
                cancellationToken).ConfigureAwait(false);

            foreach (RetrievalHit candidate in prefix)
            {
                if (!summariesByChunkId.TryGetValue(candidate.ChunkId, out string? summary))
                    continue;

                int index = mutableHits.FindIndex(
                    hit => string.Equals(hit.ChunkId, candidate.ChunkId, StringComparison.Ordinal));

                if (index < 0)
                    continue;

                mutableHits[index] = CloneWithSummarizedText(candidate, summary);
            }

            HashSet<string> summarizedChunkIds = prefix
                .Select(static hit => hit.ChunkId)
                .ToHashSet(StringComparer.Ordinal);
            remainingCandidates = remainingCandidates
                .Where(hit => !summarizedChunkIds.Contains(hit.ChunkId))
                .ToList();
        }

        return mutableHits;
    }

    /// <summary>
    ///     Greedy lowest-score prefix whose original token weight covers the overage when treated as fully removed.
    /// </summary>
    internal static IReadOnlyList<RetrievalHit> SelectSummarizationPrefix(
        IReadOnlyList<RetrievalHit> orderedCandidates,
        int estimatedTokens,
        int safeTokenLimit)
    {
        if (orderedCandidates is null || orderedCandidates.Count == 0)
            return [];

        if (estimatedTokens <= safeTokenLimit)
            return [];

        int remainingOverage = estimatedTokens - safeTokenLimit;
        List<RetrievalHit> prefix = [];

        foreach (RetrievalHit candidate in orderedCandidates)
        {
            if (remainingOverage <= 0)
                break;

            prefix.Add(candidate);
            remainingOverage -= TokenAwareContextBudget.EstimateTokenCount(candidate.Text ?? string.Empty);
        }

        return prefix;
    }

    internal static bool IsManifestCorpus(string? corpusKind)
    {
        if (string.IsNullOrWhiteSpace(corpusKind))
            return false;

        return string.Equals(corpusKind, nameof(CorpusKind.TenantManifest), StringComparison.OrdinalIgnoreCase)
               || string.Equals(corpusKind, nameof(CorpusKind.PriorManifest), StringComparison.OrdinalIgnoreCase);
    }

    internal static int EstimateTotalTokens(IReadOnlyList<RetrievalHit> hits)
    {
        int total = 0;

        foreach (RetrievalHit hit in hits)
            total += TokenAwareContextBudget.EstimateTokenCount(hit.Text ?? string.Empty);

        return total;
    }

    private static RetrievalHit CloneWithSummarizedText(RetrievalHit source, string summaryText)
    {
        RetrievalHit clone = new()
        {
            ChunkId = source.ChunkId,
            DocumentId = source.DocumentId,
            CorpusKind = source.CorpusKind,
            SourceType = source.SourceType,
            SourceId = source.SourceId,
            Title = source.Title,
            Score = source.Score,
            DecisionId = source.DecisionId,
            FindingId = source.FindingId,
            Text = "[Summarized manifest chunk] " + summaryText.Trim(),
        };

        return clone;
    }
}
