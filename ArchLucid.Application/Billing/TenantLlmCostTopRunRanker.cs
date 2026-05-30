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

        List<LlmCostTopRunRowResponse> ranked = [];

        foreach (RunSummaryDto summary in summaries)
        {
            string runHex = summary.RunId.ToString("N");
            IReadOnlyList<AgentExecutionTrace> traces = await _traceRepository
                .GetByRunIdAsync(runHex, cancellationToken)
                .ConfigureAwait(false);

            if (traces.Count == 0)
                continue;

            AgentExecutionTraceRunLlmCostSummary aggregate =
                AgentExecutionTraceRunLlmCostAggregator.Compute(traces, _costEstimator);

            if (aggregate.PromptTokens + aggregate.CompletionTokens <= 0 && aggregate.EstimatedCostUsd is null or <= 0m)
                continue;

            ranked.Add(new LlmCostTopRunRowResponse
            {
                RunId = runHex,
                EstimatedCostUsd = aggregate.EstimatedCostUsd ?? 0m,
                PromptTokens = aggregate.PromptTokens,
                CompletionTokens = aggregate.CompletionTokens,
                LlmCallCount = traces.Count,
            });
        }

        return ranked
            .OrderByDescending(static row => row.EstimatedCostUsd)
            .ThenByDescending(static row => row.PromptTokens + row.CompletionTokens)
            .Take(takeCap)
            .ToList();
    }
}
