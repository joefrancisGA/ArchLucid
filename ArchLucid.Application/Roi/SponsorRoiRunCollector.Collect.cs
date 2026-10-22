using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Concurrency;
using ArchLucid.Decisioning.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Roi;

public sealed partial class SponsorRoiRunCollector
{
    public async Task<Dictionary<string, RunSummary>> CollectLatestCommittedRunPerSystemAsync(CancellationToken cancellationToken)
    {
        Dictionary<string, RunSummary> latestBySystem = new(StringComparer.OrdinalIgnoreCase);
        string? cursor = null;
        const int take = 100;
        // Safety cap: at 100 rows per page, 2 000 pages = 200 000 runs — well beyond any real tenant.
        const int maxPages = 2_000;
        int pageCount = 0;

        while (true)
        {
            if (pageCount >= maxPages)
            {
                _logger.LogWarning(
                    "CollectLatestCommittedRunPerSystemAsync: safety max-page cap ({Cap}) reached; stopping early.",
                    maxPages);
                break;
            }

            (IReadOnlyList<RunSummary> items, bool hasMore, string? next) =
                await _runDetailQueryService.ListRunSummariesKeysetAsync(cursor, take, cancellationToken).ConfigureAwait(false);

            pageCount++;

            foreach (RunSummary summary in items)
            {
                if (!IsCommittedSummary(summary))
                    continue;

                string systemKey = NormalizeSystemName(summary.SystemName);

                if (!latestBySystem.TryGetValue(systemKey, out RunSummary? existing) || summary.CreatedUtc > existing.CreatedUtc)
                    latestBySystem[systemKey] = summary;
            }

            if (!hasMore || string.IsNullOrEmpty(next))
                break;

            cursor = next;
        }

        return latestBySystem;
    }

    public async Task<List<(RunSummary Summary, ArchitectureRunDetail Detail)>> CollectCommittedRunsForTrendsAsync(
        CancellationToken cancellationToken)
    {
        const int maxRuns = 400;
        DateTime cutoffUtc = TimeProvider.System.GetUtcNow().UtcDateTime.AddMonths(-6);
        List<(RunSummary Summary, ArchitectureRunDetail Detail)> results = [];
        string? cursor = null;
        const int take = 100;
        const int maxPages = 2_000;
        int pageCount = 0;

        while (results.Count < maxRuns)
        {
            if (pageCount >= maxPages)
            {
                _logger.LogWarning(
                    "CollectCommittedRunsForTrendsAsync: safety max-page cap ({Cap}) reached; stopping early.",
                    maxPages);
                break;
            }

            (IReadOnlyList<RunSummary> items, bool hasMore, string? next) =
                await _runDetailQueryService.ListRunSummariesKeysetAsync(cursor, take, cancellationToken).ConfigureAwait(false);

            pageCount++;

            List<RunSummary> pageCandidates = [];

            foreach (RunSummary summary in items)
            {
                if (!IsCommittedSummary(summary) || summary.CreatedUtc < cutoffUtc)
                    continue;

                pageCandidates.Add(summary);
            }

            List<(RunSummary Summary, ArchitectureRunDetail Detail)> loaded =
                await LoadRoiRunDetailsOrderedAsync(pageCandidates, cancellationToken).ConfigureAwait(false);

            foreach ((RunSummary summary, ArchitectureRunDetail detail) in loaded)
            {
                if (results.Count >= maxRuns)
                    break;

                results.Add((summary, detail));
            }

            if (!hasMore || string.IsNullOrEmpty(next))
                break;

            cursor = next;
        }

        return results;
    }

    /// <summary>
    ///     Loads ROI run details with bounded concurrency, preserving <paramref name="summaries"/> order and dropping nulls.
    /// </summary>
    public async Task<List<(RunSummary Summary, ArchitectureRunDetail Detail)>> LoadRoiRunDetailsOrderedAsync(
        IReadOnlyList<RunSummary> summaries,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(summaries);

        if (summaries.Count == 0)
            return [];

        ArchitectureRunDetail?[] detailSlots = await BoundedParallelMap.MapAsync(
            summaries,
            RunDetailRoiFanOutMaxConcurrent,
            async (summary, ct) =>
                await _runDetailQueryService.GetRunDetailForRoiAsync(summary.RunId, ct).ConfigureAwait(false),
            cancellationToken).ConfigureAwait(false);

        List<(RunSummary Summary, ArchitectureRunDetail Detail)> loaded = [];

        for (int index = 0; index < summaries.Count; index++)
        {
            ArchitectureRunDetail? detail = detailSlots[index];

            if (detail is null)
                continue;

            loaded.Add((summaries[index], detail));
        }

        return loaded;
    }

    /// <summary>
    ///     Resolves estimated USD savings for each detail with bounded concurrency (same order as <paramref name="details"/>).
    /// </summary>
    public async Task<decimal?[]> ResolveEstimatedUsdSavingsOrderedAsync(
        IReadOnlyList<ArchitectureRunDetail> details,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(details);

        if (details.Count == 0)
            return [];

        return await BoundedParallelMap.MapAsync(
            details,
            RunDetailRoiFanOutMaxConcurrent,
            async (detail, ct) =>
                await TryResolveEstimatedUsdSavingsAsync(detail.Run.FindingsSnapshotId, ct).ConfigureAwait(false),
            cancellationToken).ConfigureAwait(false);
    }

    private Task<decimal?> TryResolveEstimatedUsdSavingsAsync(Guid? findingsSnapshotId, CancellationToken cancellationToken) =>
        _tenantEstimatedUsdSavingsResolver.ResolveFromFindingsSnapshotIdAsync(findingsSnapshotId, cancellationToken);
}
