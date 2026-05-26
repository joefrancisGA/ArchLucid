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
        List<RetrievalHit> manifestHits = mutableHits
            .Where(static hit => IsManifestCorpus(hit.CorpusKind))
            .OrderBy(static hit => hit.Score)
            .ToList();

        if (manifestHits.Count == 0)
            return hits;

        foreach (RetrievalHit candidate in manifestHits)
        {
            estimatedTokens = EstimateTotalTokens(mutableHits);

            if (estimatedTokens <= options.SafeTokenLimit)
                break;

            int index = mutableHits.FindIndex(hit => string.Equals(hit.ChunkId, candidate.ChunkId, StringComparison.Ordinal));

            if (index < 0)
                continue;

            string summary = await _summaryCompletionClient
                .SummarizeChunkAsync(candidate.Text, cancellationToken)
                .ConfigureAwait(false);

            mutableHits[index] = CloneWithSummarizedText(candidate, summary);
        }

        return mutableHits;
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
