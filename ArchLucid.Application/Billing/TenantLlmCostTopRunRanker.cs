using ArchLucid.Application.Agents;
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
    private const string DefaultProjectSlug = "default";

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

        IReadOnlyList<RunSummaryDto> summaries = await _authorityQueryService
            .ListRunsByProjectAsync(scope, DefaultProjectSlug, scanCap, cancellationToken)
            .ConfigureAwait(false);

        List<string> runHexIds = summaries
            .Select(static summary => summary.RunId.ToString("N"))
            .ToList();

        // One scoped query for every scanned run instead of one round-trip per run.
        IReadOnlyDictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>> slicesByRunId =
            await _traceRepository
                .GetLlmCostSlicesByRunIdsAsync(scope, runHexIds, cancellationToken)
                .ConfigureAwait(false);

        return runHexIds
            .Select(runHex => TryBuildRow(runHex, slicesByRunId))
            .OfType<LlmCostTopRunRowResponse>()
            .OrderByDescending(static row => row.EstimatedCostUsd)
            .ThenByDescending(static row => row.PromptTokens + row.CompletionTokens)
            .Take(takeCap)
            .ToList();
    }

    /// <summary>
    ///     Returns <see langword="null" /> when the run has no traces or aggregates to zero cost and zero tokens,
    ///     which keeps it out of the ranking entirely.
    /// </summary>
    private LlmCostTopRunRowResponse? TryBuildRow(
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

        if (aggregate.PromptTokens + aggregate.CompletionTokens <= 0 && aggregate.EstimatedCostUsd is null or <= 0m)
            return null;

        return new LlmCostTopRunRowResponse
        {
            RunId = runHex,
            EstimatedCostUsd = aggregate.EstimatedCostUsd ?? 0m,
            PromptTokens = aggregate.PromptTokens,
            CompletionTokens = aggregate.CompletionTokens,
            LlmCallCount = slices.Count,
        };
    }
}
