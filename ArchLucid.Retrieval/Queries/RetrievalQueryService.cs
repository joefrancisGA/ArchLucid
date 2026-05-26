using System.Diagnostics;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Retrieval;

using Microsoft.Extensions.Options;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.PolicyPacks;
using ArchLucid.Retrieval.Reranking;
using ArchLucid.Retrieval.Summarization;

namespace ArchLucid.Retrieval.Queries;

/// <summary>
///     <see cref="IRetrievalQueryService" /> implementation: embed query text, delegate to <see cref="IVectorIndex" />.
/// </summary>
public sealed class RetrievalQueryService(
    IEmbeddingService embeddingService,
    IVectorIndex vectorIndex,
    IRetrievalReranker retrievalReranker,
    AssignedPolicyPackRulePackIdResolver assignedPolicyPackRulePackIdResolver,
    IManifestChunkSummarizer manifestChunkSummarizer,
    IOptionsMonitor<RetrievalTelemetryOptions> retrievalTelemetryOptions,
    IOptionsMonitor<RetrievalRerankingOptions> rerankingOptions) : IRetrievalQueryService
{
    private readonly IRetrievalReranker _retrievalReranker =
        retrievalReranker ?? throw new ArgumentNullException(nameof(retrievalReranker));

    private readonly AssignedPolicyPackRulePackIdResolver _assignedPolicyPackRulePackIdResolver =
        assignedPolicyPackRulePackIdResolver ?? throw new ArgumentNullException(nameof(assignedPolicyPackRulePackIdResolver));

    private readonly IManifestChunkSummarizer _manifestChunkSummarizer =
        manifestChunkSummarizer ?? throw new ArgumentNullException(nameof(manifestChunkSummarizer));

    private readonly IOptionsMonitor<RetrievalTelemetryOptions> _retrievalTelemetryOptions =
        retrievalTelemetryOptions ?? throw new ArgumentNullException(nameof(retrievalTelemetryOptions));

    private readonly IOptionsMonitor<RetrievalRerankingOptions> _rerankingOptions =
        rerankingOptions ?? throw new ArgumentNullException(nameof(rerankingOptions));

    /// <inheritdoc />
    public async Task<IReadOnlyList<RetrievalHit>> SearchAsync(RetrievalQuery query, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(query);
        ArgumentException.ThrowIfNullOrWhiteSpace(query.QueryText);

        if (query.TenantId == Guid.Empty && !query.IncludePlatformCorpora)
            throw new ArgumentException("TenantId is required for tenant-bound retrieval.", nameof(query));

        if (query.IncludePlatformCorpora && query.AllowedPolicyPackRulePackIds is null)
        {
            HashSet<string> assigned = await _assignedPolicyPackRulePackIdResolver
                .ResolveAsync(query.TenantId, query.WorkspaceId, query.ProjectId, ct)
                .ConfigureAwait(false);

            query.AllowedPolicyPackRulePackIds = assigned;
        }

        long startTicks = Stopwatch.GetTimestamp();

        int finalTopK = Math.Clamp(query.TopK, 1, 25);
        RetrievalRerankingOptions rerankOptions = _rerankingOptions.CurrentValue;
        int candidateTopK = rerankOptions.Enabled
            ? Math.Max(finalTopK, rerankOptions.GetEffectiveMaxCandidates())
            : finalTopK;

        RetrievalQuery searchQuery = CloneWithTopK(query, candidateTopK);

        float[] embedding = await embeddingService.EmbedAsync(query.QueryText, ct);
        IReadOnlyList<RetrievalHit> hits = await vectorIndex.SearchAsync(searchQuery, embedding, ct).ConfigureAwait(false);

        if (rerankOptions.Enabled && hits.Count > 0)
        {
            hits = await _retrievalReranker
                .RerankAsync(query.QueryText, hits, finalTopK, ct)
                .ConfigureAwait(false);
        }
        else if (hits.Count > finalTopK)
        {
            hits = hits
                .OrderByDescending(static hit => hit.Score)
                .Take(finalTopK)
                .ToList();
        }

        hits = await _manifestChunkSummarizer.MaybeSummarizeAsync(hits, ct).ConfigureAwait(false);

        double durationMilliseconds = Stopwatch.GetElapsedTime(startTicks).TotalMilliseconds;
        bool recordPerTenantTags = _retrievalTelemetryOptions.CurrentValue.RecordPerTenantTags;
        ArchLucidInstrumentation.RecordRagRetrievalSearch(
            durationMilliseconds,
            hits,
            query.TenantId,
            recordPerTenantTags);

        return hits;
    }

    private static RetrievalQuery CloneWithTopK(RetrievalQuery query, int topK)
    {
        return new RetrievalQuery
        {
            TenantId = query.TenantId,
            WorkspaceId = query.WorkspaceId,
            ProjectId = query.ProjectId,
            RunId = query.RunId,
            ManifestId = query.ManifestId,
            QueryText = query.QueryText,
            TopK = topK,
            IncludePlatformCorpora = query.IncludePlatformCorpora,
            AllowedPolicyPackRulePackIds = query.AllowedPolicyPackRulePackIds
        };
    }
}
