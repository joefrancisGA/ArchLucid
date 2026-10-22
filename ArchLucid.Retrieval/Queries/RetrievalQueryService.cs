using System.Diagnostics;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Retrieval;

using Microsoft.Extensions.Options;
using ArchLucid.Retrieval.Agentic;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.PolicyPacks;
using ArchLucid.Retrieval.Reranking;
using ArchLucid.Retrieval.Summarization;

namespace ArchLucid.Retrieval.Queries;

/// <summary>
///     <see cref="IRetrievalQueryService" /> implementation: agentic query expansion, embed, vector search, rerank,
///     optional Graph-RAG neighbor expansion, and optional iterative retrieve-critique-retry (TB-878).
/// </summary>
public sealed class RetrievalQueryService(
    IEmbeddingService embeddingService,
    IVectorIndex vectorIndex,
    IRetrievalReranker retrievalReranker,
    AssignedPolicyPackRulePackIdResolver assignedPolicyPackRulePackIdResolver,
    IManifestChunkSummarizer manifestChunkSummarizer,
    IAgenticRetrievalQueryExpander agenticRetrievalQueryExpander,
    IGraphRagNeighborExpander graphRagNeighborExpander,
    IterativeRetrievalLoop iterativeRetrievalLoop,
    IOptionsMonitor<RetrievalTelemetryOptions> retrievalTelemetryOptions,
    IOptionsMonitor<RetrievalRerankingOptions> rerankingOptions,
    IOptionsMonitor<AdvancedRetrievalOptions> advancedRetrievalOptions,
    IOptionsMonitor<RetrievalQueryBudgetOptions> queryBudgetOptions) : IRetrievalQueryService
{
    private readonly IEmbeddingService _embeddingService =
        embeddingService ?? throw new ArgumentNullException(nameof(embeddingService));

    private readonly IVectorIndex _vectorIndex =
        vectorIndex ?? throw new ArgumentNullException(nameof(vectorIndex));

    private readonly IRetrievalReranker _retrievalReranker =
        retrievalReranker ?? throw new ArgumentNullException(nameof(retrievalReranker));

    private readonly AssignedPolicyPackRulePackIdResolver _assignedPolicyPackRulePackIdResolver =
        assignedPolicyPackRulePackIdResolver ?? throw new ArgumentNullException(nameof(assignedPolicyPackRulePackIdResolver));

    private readonly IManifestChunkSummarizer _manifestChunkSummarizer =
        manifestChunkSummarizer ?? throw new ArgumentNullException(nameof(manifestChunkSummarizer));

    private readonly IAgenticRetrievalQueryExpander _agenticRetrievalQueryExpander =
        agenticRetrievalQueryExpander ?? throw new ArgumentNullException(nameof(agenticRetrievalQueryExpander));

    private readonly IGraphRagNeighborExpander _graphRagNeighborExpander =
        graphRagNeighborExpander ?? throw new ArgumentNullException(nameof(graphRagNeighborExpander));

    private readonly IterativeRetrievalLoop _iterativeRetrievalLoop =
        iterativeRetrievalLoop ?? throw new ArgumentNullException(nameof(iterativeRetrievalLoop));

    private readonly IOptionsMonitor<RetrievalTelemetryOptions> _retrievalTelemetryOptions =
        retrievalTelemetryOptions ?? throw new ArgumentNullException(nameof(retrievalTelemetryOptions));

    private readonly IOptionsMonitor<RetrievalRerankingOptions> _rerankingOptions =
        rerankingOptions ?? throw new ArgumentNullException(nameof(rerankingOptions));

    private readonly IOptionsMonitor<AdvancedRetrievalOptions> _advancedRetrievalOptions =
        advancedRetrievalOptions ?? throw new ArgumentNullException(nameof(advancedRetrievalOptions));

    private readonly IOptionsMonitor<RetrievalQueryBudgetOptions> _queryBudgetOptions =
        queryBudgetOptions ?? throw new ArgumentNullException(nameof(queryBudgetOptions));

    /// <inheritdoc />
    public async Task<IReadOnlyList<RetrievalHit>> SearchAsync(RetrievalQuery query, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(query);
        ArgumentException.ThrowIfNullOrWhiteSpace(query.QueryText);

        if (query.TenantId == Guid.Empty && !query.IncludePlatformCorpora)
            throw new ArgumentException("TenantId is required for tenant-bound retrieval.", nameof(query));

        using CancellationTokenSource budgetSource = CancellationTokenSource.CreateLinkedTokenSource(ct);
        budgetSource.CancelAfter(_queryBudgetOptions.CurrentValue.GetEffectiveOverallTimeout());
        CancellationToken budgetCt = budgetSource.Token;

        long startTicks = Stopwatch.GetTimestamp();

        (AgenticRetrievalQueryPlan queryPlan, HashSet<string>? resolvedPolicyPackRulePackIds) =
            await ResolveQueryPlanAsync(query, budgetCt).ConfigureAwait(false);

        Func<RetrievalQuery, AgenticRetrievalQueryPlan, CancellationToken, Task<IReadOnlyList<RetrievalHit>>> executeSearchPass =
            (searchQuery, plan, cancellationToken) =>
                ExecuteSearchPassAsync(
                    searchQuery,
                    plan,
                    cancellationToken,
                    resolvedPolicyPackRulePackIds);

        IReadOnlyList<RetrievalHit> initialHits = await executeSearchPass(query, queryPlan, budgetCt)
            .ConfigureAwait(false);

        (IReadOnlyList<RetrievalHit> hits, IterativeRetrievalTraceState? iterativeTrace) =
            await _iterativeRetrievalLoop
                .MaybeRetryAsync(
                    query,
                    queryPlan,
                    initialHits,
                    executeSearchPass,
                    budgetCt)
                .ConfigureAwait(false);

        IterativeRetrievalAmbient.Set(iterativeTrace);

        hits = await _manifestChunkSummarizer.MaybeSummarizeAsync(hits, budgetCt).ConfigureAwait(false);

        double durationMilliseconds = Stopwatch.GetElapsedTime(startTicks).TotalMilliseconds;
        bool recordPerTenantTags = _retrievalTelemetryOptions.CurrentValue.RecordPerTenantTags;
        ArchLucidInstrumentation.RecordRagRetrievalSearch(
            durationMilliseconds,
            hits,
            query.TenantId,
            recordPerTenantTags);

        return hits;
    }

    private async Task<(AgenticRetrievalQueryPlan Plan, HashSet<string>? AllowedPolicyPackRulePackIds)> ResolveQueryPlanAsync(
        RetrievalQuery query,
        CancellationToken budgetCt)
    {
        if (query.SkipQueryExpansion)
        {
            HashSet<string>? allowedPolicyPackRulePackIds = query.AllowedPolicyPackRulePackIds;

            if (query.IncludePlatformCorpora && query.AllowedPolicyPackRulePackIds is null)
            {
                allowedPolicyPackRulePackIds = await _assignedPolicyPackRulePackIdResolver
                    .ResolveAsync(query.TenantId, query.WorkspaceId, query.ProjectId, budgetCt)
                    .ConfigureAwait(false);
            }

            string trimmedQuery = query.QueryText.Trim();

            return (
                new AgenticRetrievalQueryPlan
                {
                    OriginalQueryText = query.QueryText,
                    RerankQueryText = trimmedQuery,
                    EmbedText = trimmedQuery,
                    UsedHyde = false,
                    UsedQueryRewrite = false,
                },
                allowedPolicyPackRulePackIds);
        }

        HashSet<string>? resolvedPolicyPackRulePackIds = query.AllowedPolicyPackRulePackIds;

        if (query.IncludePlatformCorpora && query.AllowedPolicyPackRulePackIds is null)
        {
            Task<HashSet<string>> resolveTask = _assignedPolicyPackRulePackIdResolver
                .ResolveAsync(query.TenantId, query.WorkspaceId, query.ProjectId, budgetCt);
            Task<AgenticRetrievalQueryPlan> expandTask = _agenticRetrievalQueryExpander
                .ExpandAsync(query.QueryText, budgetCt);

            await Task.WhenAll(resolveTask, expandTask).ConfigureAwait(false);

            resolvedPolicyPackRulePackIds = await resolveTask.ConfigureAwait(false);

            return (await expandTask.ConfigureAwait(false), resolvedPolicyPackRulePackIds);
        }

        return (
            await _agenticRetrievalQueryExpander
                .ExpandAsync(query.QueryText, budgetCt)
                .ConfigureAwait(false),
            resolvedPolicyPackRulePackIds);
    }

    private async Task<IReadOnlyList<RetrievalHit>> ExecuteSearchPassAsync(
        RetrievalQuery query,
        AgenticRetrievalQueryPlan queryPlan,
        CancellationToken budgetCt,
        HashSet<string>? resolvedPolicyPackRulePackIds)
    {
        int finalTopK = Math.Clamp(query.TopK, 1, RetrievalQuery.MaxTopK);
        RetrievalRerankingOptions rerankOptions = _rerankingOptions.CurrentValue;
        bool applyRerank = rerankOptions.Enabled && !query.SkipReranking;
        int candidateTopK = applyRerank
            ? Math.Max(finalTopK, rerankOptions.GetEffectiveMaxCandidates())
            : finalTopK;

        RetrievalQuery searchQuery = CloneWithTopK(query, candidateTopK, resolvedPolicyPackRulePackIds);

        float[] embedding = await _embeddingService.EmbedAsync(queryPlan.EmbedText, budgetCt);
        IReadOnlyList<RetrievalHit> hits = await _vectorIndex
            .SearchAsync(searchQuery, embedding, budgetCt)
            .ConfigureAwait(false);

        if (applyRerank && hits.Count > 0)
        {
            hits = await _retrievalReranker
                .RerankAsync(queryPlan.RerankQueryText, hits, finalTopK, budgetCt)
                .ConfigureAwait(false);
        }
        else if (hits.Count > finalTopK)
        {
            hits = hits
                .OrderByDescending(static hit => hit.Score)
                .Take(finalTopK)
                .ToList();
        }

        AdvancedRetrievalOptions advancedOptions = _advancedRetrievalOptions.CurrentValue;

        if (advancedOptions.Enabled && advancedOptions.EnableGraphRag && hits.Count > 0)
        {
            hits = await _graphRagNeighborExpander
                .ExpandAsync(query, hits, budgetCt)
                .ConfigureAwait(false);

            if (hits.Count > finalTopK)
            {
                hits = hits
                    .OrderByDescending(static hit => hit.Score)
                    .Take(finalTopK)
                    .ToList();
            }
        }

        return hits;
    }

    private static RetrievalQuery CloneWithTopK(
        RetrievalQuery query,
        int topK,
        HashSet<string>? resolvedPolicyPackRulePackIds)
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
            AllowedPolicyPackRulePackIds = resolvedPolicyPackRulePackIds ?? query.AllowedPolicyPackRulePackIds,
            SkipReranking = query.SkipReranking,
            SkipQueryExpansion = query.SkipQueryExpansion
        };
    }
}
