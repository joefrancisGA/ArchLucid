using ArchLucid.Application;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Governance;

internal static class GovernanceDashboardRecentRunTokenAggregator
{
    internal const int RecentRunCap = 50;

    internal static readonly TimeSpan RecentWindow = TimeSpan.FromDays(30);

    internal static async Task<(long PromptTokens, long CompletionTokens)> AggregateAsync(
        IRunDetailQueryService runDetailQueryService,
        IAgentExecutionTraceRepository traceRepository,
        IScopeContextProvider scopeContextProvider,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(runDetailQueryService);
        ArgumentNullException.ThrowIfNull(traceRepository);
        ArgumentNullException.ThrowIfNull(scopeContextProvider);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        DateTime windowStartUtc = TimeProvider.System.UtcNowDateTime().Subtract(RecentWindow);
        List<string> recentRunIds = [];
        string? cursor = null;
        const int take = 100;

        while (recentRunIds.Count < RecentRunCap)
        {
            (IReadOnlyList<RunSummary> items, bool hasMore, string? next) =
                await runDetailQueryService.ListRunSummariesKeysetAsync(cursor, take, cancellationToken).ConfigureAwait(false);

            if (items.Count == 0)
                break;

            foreach (RunSummary summary in items)
            {
                if (recentRunIds.Count >= RecentRunCap)
                    break;

                if (!IsCommittedSummary(summary))
                    continue;

                if (summary.CreatedUtc < windowStartUtc)
                    return await SumTokenTotalsAsync(scope, traceRepository, recentRunIds, cancellationToken);

                recentRunIds.Add(summary.RunId);
            }

            if (!hasMore || string.IsNullOrEmpty(next))
                break;

            cursor = next;
        }

        return await SumTokenTotalsAsync(scope, traceRepository, recentRunIds, cancellationToken);
    }

    private static async Task<(long PromptTokens, long CompletionTokens)> SumTokenTotalsAsync(
        ScopeContext scope,
        IAgentExecutionTraceRepository traceRepository,
        IReadOnlyList<string> runIds,
        CancellationToken cancellationToken)
    {
        if (runIds.Count == 0)
            return (0, 0);

        IReadOnlyDictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>> slicesByRun =
            await traceRepository.GetLlmCostSlicesByRunIdsAsync(scope, runIds, cancellationToken).ConfigureAwait(false);

        long promptTotal = 0;
        long completionTotal = 0;

        foreach (string runId in runIds)
        {
            if (!slicesByRun.TryGetValue(runId, out IReadOnlyList<AgentExecutionTraceLlmCostSlice>? slices))
                continue;

            foreach (AgentExecutionTraceLlmCostSlice slice in slices)
            {
                promptTotal += slice.InputTokenCount ?? 0;
                completionTotal += slice.OutputTokenCount ?? 0;
            }
        }

        return (promptTotal, completionTotal);
    }

    private static bool IsCommittedSummary(RunSummary summary) =>
        string.Equals(summary.Status, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase);
}
