using System.Text.Json;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Agentic;

/// <summary>Bounded retrieve-critique-retry loop after single-pass expansion (TB-878).</summary>
public sealed class IterativeRetrievalLoop(
    IAgenticRetrievalCompletionClient completionClient,
    IAgenticRetrievalQueryExpander queryExpander,
    IOptionsMonitor<AdvancedRetrievalOptions> optionsMonitor,
    ILogger<IterativeRetrievalLoop> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IAgenticRetrievalCompletionClient _completionClient =
        completionClient ?? throw new ArgumentNullException(nameof(completionClient));

    private readonly IAgenticRetrievalQueryExpander _queryExpander =
        queryExpander ?? throw new ArgumentNullException(nameof(queryExpander));

    private readonly IOptionsMonitor<AdvancedRetrievalOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<IterativeRetrievalLoop> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<(IReadOnlyList<RetrievalHit> Hits, IterativeRetrievalTraceState? Trace)> MaybeRetryAsync(
        RetrievalQuery query,
        AgenticRetrievalQueryPlan initialPlan,
        IReadOnlyList<RetrievalHit> initialHits,
        Func<RetrievalQuery, AgenticRetrievalQueryPlan, CancellationToken, Task<IReadOnlyList<RetrievalHit>>> searchPassAsync,
        CancellationToken cancellationToken)
    {
        AdvancedRetrievalOptions options = _optionsMonitor.CurrentValue;

        if (!options.Enabled || !options.EnableIterativeRetrieveCritiqueRetry || query.SkipQueryExpansion)
            return (initialHits, null);

        int maxRounds = options.GetEffectiveMaxIterativeRetrievalRounds();

        if (maxRounds <= 1)
            return (initialHits, null);

        List<RetrievalHit> merged = initialHits.ToList();

        List<object> decisions = [];

        string critiqueQuery = query.QueryText;

        int roundsExecuted = 1;

        for (int round = 2; round <= maxRounds; round++)
        {
            RetrievalCritiqueVerdict verdict = await _completionClient
                .CritiqueRetrievalAsync(critiqueQuery, merged, cancellationToken)
                .ConfigureAwait(false);

            decisions.Add(new { round, sufficient = verdict.IsSufficient, refined = verdict.RefinedQueryText });

            if (verdict.IsSufficient)
                break;

            if (string.IsNullOrWhiteSpace(verdict.RefinedQueryText))
                break;

            critiqueQuery = verdict.RefinedQueryText.Trim();

            RetrievalQuery retryQuery = CloneWithQueryText(query, critiqueQuery);

            AgenticRetrievalQueryPlan retryPlan = await _queryExpander
                .ExpandAsync(critiqueQuery, cancellationToken)
                .ConfigureAwait(false);

            IReadOnlyList<RetrievalHit> retryHits = await searchPassAsync(retryQuery, retryPlan, cancellationToken)
                .ConfigureAwait(false);

            merged = MergeHits(merged, retryHits);

            roundsExecuted = round;

            _logger.LogDebug(
                "Iterative retrieval round {Round} merged {HitCount} hits for tenant {TenantId}.",
                round,
                merged.Count,
                query.TenantId);
        }

        string? decisionsJson = decisions.Count > 0
            ? JsonSerializer.Serialize(decisions, JsonOptions)
            : null;

        return (
            merged,
            new IterativeRetrievalTraceState
            {
                IterativeRetrievalRounds = roundsExecuted,
                IterativeCritiqueDecisionsJson = decisionsJson,
            });
    }

    private static RetrievalQuery CloneWithQueryText(RetrievalQuery query, string queryText)
    {
        return new RetrievalQuery
        {
            TenantId = query.TenantId,
            WorkspaceId = query.WorkspaceId,
            ProjectId = query.ProjectId,
            RunId = query.RunId,
            ManifestId = query.ManifestId,
            QueryText = queryText,
            TopK = query.TopK,
            IncludePlatformCorpora = query.IncludePlatformCorpora,
            AllowedPolicyPackRulePackIds = query.AllowedPolicyPackRulePackIds,
            SkipReranking = query.SkipReranking,
            SkipQueryExpansion = query.SkipQueryExpansion,
        };
    }

    private static List<RetrievalHit> MergeHits(
        IReadOnlyList<RetrievalHit> existing,
        IReadOnlyList<RetrievalHit> additional)
    {
        Dictionary<string, RetrievalHit> byChunk = new(StringComparer.Ordinal);

        foreach (RetrievalHit hit in existing)
            byChunk[hit.ChunkId] = hit;

        foreach (RetrievalHit hit in additional)
        {
            if (!byChunk.ContainsKey(hit.ChunkId))
                byChunk[hit.ChunkId] = hit;
        }

        return byChunk.Values
            .OrderByDescending(static hit => hit.Score)
            .ToList();
    }
}
