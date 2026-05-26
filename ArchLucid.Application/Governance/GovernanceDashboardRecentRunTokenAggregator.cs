using ArchLucid.Application;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Sums LLM prompt/completion tokens from agent execution traces on recent committed runs (tenant-scoped via RLS).
/// </summary>
internal static class GovernanceDashboardRecentRunTokenAggregator
{
    internal const int RecentRunCap = 50;

    internal static readonly TimeSpan RecentWindow = TimeSpan.FromDays(30);

    internal static async Task<(long PromptTokens, long CompletionTokens)> AggregateAsync(
        IRunDetailQueryService runDetailQueryService,
        IAgentExecutionTraceRepository traceRepository,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(runDetailQueryService);
        ArgumentNullException.ThrowIfNull(traceRepository);

        DateTime windowStartUtc = TimeProvider.System.UtcNowDateTime().Subtract(RecentWindow);
        long promptTotal = 0;
        long completionTotal = 0;
        int runsScanned = 0;
        string? cursor = null;
        const int take = 100;

        while (runsScanned < RecentRunCap)
        {
            (IReadOnlyList<RunSummary> items, bool hasMore, string? next) =
                await runDetailQueryService.ListRunSummariesKeysetAsync(cursor, take, cancellationToken).ConfigureAwait(false);

            if (items.Count == 0)
                break;

            foreach (RunSummary summary in items)
            {
                if (runsScanned >= RecentRunCap)
                    break;

                if (!IsCommittedSummary(summary))
                    continue;

                if (summary.CreatedUtc < windowStartUtc)
                    return (promptTotal, completionTotal);

                IReadOnlyList<Contracts.Agents.AgentExecutionTrace> traces =
                    await traceRepository.GetByRunIdAsync(summary.RunId, cancellationToken).ConfigureAwait(false);

                foreach (Contracts.Agents.AgentExecutionTrace trace in traces)
                {
                    promptTotal += trace.InputTokenCount ?? 0;
                    completionTotal += trace.OutputTokenCount ?? 0;
                }

                runsScanned++;
            }

            if (!hasMore || string.IsNullOrEmpty(next))
                break;

            cursor = next;
        }

        return (promptTotal, completionTotal);
    }

    private static bool IsCommittedSummary(RunSummary summary)
    {
        if (string.Equals(summary.Status, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            return true;

        return !string.IsNullOrWhiteSpace(summary.CurrentManifestVersion);
    }
}
