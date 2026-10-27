using ArchLucid.Application.Agents;
using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Billing;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Billing;

/// <summary>
///     Ranks recent scoped runs by re-estimated trace LLM cost (same math as run detail forensics).
/// </summary>
public sealed class TenantLlmCostTopRunRanker(
    IScopeContextProvider scopeContextProvider,
    IAuthorityQueryService authorityQueryService,
    IAgentExecutionTraceRepository traceRepository,
    ILlmCostEstimator costEstimator) : ITenantLlmCostTopRunRanker
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IAgentExecutionTraceRepository _traceRepository =
        traceRepository ?? throw new ArgumentNullException(nameof(traceRepository));

    private readonly ILlmCostEstimator _costEstimator =
        costEstimator ?? throw new ArgumentNullException(nameof(costEstimator));

    public async Task<IReadOnlyList<LlmCostTopRunRowResponse>> RankAsync(
        int maxRunsToScan,
        int take,
        CancellationToken cancellationToken = default)
    {
        int scanCap = Math.Clamp(maxRunsToScan, 1, 30);
        int takeCap = Math.Clamp(take, 1, 10);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        // Create maps SystemName onto the run project slug, so listing only "default" misses real reviews.
        (IReadOnlyList<RunSummaryDto> summaries, _) = await _authorityQueryService
            .ListRunsInScopeKeysetAsync(scope, cursorCreatedUtc: null, cursorRunId: null, scanCap, cancellationToken)
            .ConfigureAwait(false);

        List<string> runHexIds = summaries
            .Select(static summary => summary.RunId.ToString("N"))
            .ToList();

        Dictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>> slicesByRunId =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (string runHex in runHexIds)
        {
            IReadOnlyList<AgentExecutionTraceLlmCostSlice> slices =
                await AnalysisRunIdCanonicalization.LoadLlmCostSlicesByRunIdAsync(
                    _traceRepository,
                    scope,
                    runHex,
                    cancellationToken).ConfigureAwait(false);

            slicesByRunId[runHex] = slices;
        }

        return runHexIds
            .Select(runHex => TryBuildRow(runHex, slicesByRunId))
            .OfType<RankedLlmCostRun>()
            .OrderByDescending(static ranked => ranked.Row.EstimatedCostUsd)
            // Cost ties, including every unpriced run, must count reasoning tokens or a one-token prompt outranks them.
            .ThenByDescending(static ranked => ranked.MeasurableTokens)
            // Keyset scan order is not stable across polls; break remaining ties on run id.
            .ThenByDescending(static ranked => ranked.Row.RunId, StringComparer.Ordinal)
            .Take(takeCap)
            .Select(static ranked => ranked.Row)
            .ToList();
    }

    /// <summary>
    ///     Returns <see langword="null" /> when the run has no traces or aggregates to zero cost and zero tokens,
    ///     which keeps it out of the ranking entirely.
    /// </summary>
    private RankedLlmCostRun? TryBuildRow(
        string runHex,
        IReadOnlyDictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>> slicesByRunId)
    {
        ArgumentNullException.ThrowIfNull(slicesByRunId);

        if (!slicesByRunId.TryGetValue(runHex, out IReadOnlyList<AgentExecutionTraceLlmCostSlice>? slices)
            || slices is null
            || slices.Count == 0)
        {
            return null;
        }

        AgentExecutionTraceRunLlmCostSummary aggregate =
            AgentExecutionTraceRunLlmCostAggregator.Compute(slices, _costEstimator);

        long measurableTokens = aggregate.PromptTokens + aggregate.CompletionTokens + aggregate.ReasoningTokens;

        if (measurableTokens <= 0 && (aggregate.EstimatedCostUsd is null or <= 0m))
        {
            return null;
        }

        LlmCostTopRunRowResponse row = new()
        {
            RunId = runHex,
            EstimatedCostUsd = aggregate.EstimatedCostUsd ?? 0m,
            PromptTokens = aggregate.PromptTokens,
            CompletionTokens = aggregate.CompletionTokens,
            ReasoningTokens = aggregate.ReasoningTokens,
            LlmCallCount = slices.Count,
        };

        return new RankedLlmCostRun(row, measurableTokens);
    }
}
