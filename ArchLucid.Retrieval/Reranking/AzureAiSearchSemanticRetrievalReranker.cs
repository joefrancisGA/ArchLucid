using System.Diagnostics;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Indexing;

using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Reranking;

/// <summary>
///     Azure AI Search semantic ranker when configured; otherwise lexical overlap (Development / InMemory index).
/// </summary>
public sealed class AzureAiSearchSemanticRetrievalReranker(
    IAzureSearchClient azureSearchClient,
    LexicalOverlapRetrievalReranker lexicalFallback,
    PassThroughRetrievalReranker passThrough,
    IOptionsMonitor<RetrievalRerankingOptions> rerankingOptions) : IRetrievalReranker
{
    private readonly IAzureSearchClient _azureSearchClient =
        azureSearchClient ?? throw new ArgumentNullException(nameof(azureSearchClient));

    private readonly LexicalOverlapRetrievalReranker _lexicalFallback =
        lexicalFallback ?? throw new ArgumentNullException(nameof(lexicalFallback));

    private readonly PassThroughRetrievalReranker _passThrough =
        passThrough ?? throw new ArgumentNullException(nameof(passThrough));

    private readonly IOptionsMonitor<RetrievalRerankingOptions> _rerankingOptions =
        rerankingOptions ?? throw new ArgumentNullException(nameof(rerankingOptions));

    /// <inheritdoc />
    public async Task<IReadOnlyList<RetrievalHit>> RerankAsync(
        string queryText,
        IReadOnlyList<RetrievalHit> candidates,
        int finalTopK,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(queryText);
        ArgumentNullException.ThrowIfNull(candidates);

        RetrievalRerankingOptions options = _rerankingOptions.CurrentValue;

        if (!options.Enabled)
            return await _passThrough.RerankAsync(queryText, candidates, finalTopK, cancellationToken).ConfigureAwait(false);

        long startTicks = Stopwatch.GetTimestamp();

        IReadOnlyList<RetrievalHit> reranked;

        if (_azureSearchClient.IsConfigured && options.Provider == RetrievalRerankProvider.AzureAiSearchSemantic)
        {
            reranked = await _azureSearchClient
                .SemanticRerankAsync(queryText, candidates, finalTopK, cancellationToken)
                .ConfigureAwait(false);
        }
        else
        {
            reranked = await _lexicalFallback
                .RerankAsync(queryText, candidates, finalTopK, cancellationToken)
                .ConfigureAwait(false);
        }

        double durationMilliseconds = Stopwatch.GetElapsedTime(startTicks).TotalMilliseconds;
        ArchLucidInstrumentation.RecordRetrievalRerankLatency(durationMilliseconds, reranked.Count);

        return reranked;
    }
}
