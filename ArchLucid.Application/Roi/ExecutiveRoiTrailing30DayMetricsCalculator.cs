using ArchLucid.Application;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Roi;

/// <summary>
///     Computes trailing 30-day finding discovery and resolution counts for executive ROI summaries.
/// </summary>
internal static class ExecutiveRoiTrailing30DayMetricsCalculator
{
    internal static readonly TimeSpan TrailingWindow = TimeSpan.FromDays(30);

    internal static async Task<(int ResolvedCount, int NewlyDiscoveredCount)> ComputeAsync(
        IRunDetailQueryService runDetailQueryService,
        IFindingReviewTrailRepository findingReviewTrailRepository,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(runDetailQueryService);
        ArgumentNullException.ThrowIfNull(findingReviewTrailRepository);

        DateTimeOffset sinceUtc = TimeProvider.System.UtcNowDateTime().Subtract(TrailingWindow);
        int newlyDiscovered = await CountNewlyDiscoveredFindingsAsync(runDetailQueryService, sinceUtc.UtcDateTime, cancellationToken)
            .ConfigureAwait(false);
        int resolved = await CountResolvedFindingsAsync(findingReviewTrailRepository, tenantId, sinceUtc, cancellationToken)
            .ConfigureAwait(false);

        return (resolved, newlyDiscovered);
    }

    private static async Task<int> CountResolvedFindingsAsync(
        IFindingReviewTrailRepository findingReviewTrailRepository,
        Guid tenantId,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<FindingReviewEventRecord> events =
            await findingReviewTrailRepository.ListSinceUtcAsync(tenantId, sinceUtc, cancellationToken).ConfigureAwait(false);

        HashSet<string> resolvedFindingIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (FindingReviewEventRecord reviewEvent in events)
        {
            if (reviewEvent.Action is not (FindingReviewAction.Approve or FindingReviewAction.Override))
                continue;

            if (string.IsNullOrWhiteSpace(reviewEvent.FindingId))
                continue;

            resolvedFindingIds.Add(reviewEvent.FindingId.Trim());
        }

        return resolvedFindingIds.Count;
    }

    private static async Task<int> CountNewlyDiscoveredFindingsAsync(
        IRunDetailQueryService runDetailQueryService,
        DateTime windowStartUtc,
        CancellationToken cancellationToken)
    {
        HashSet<string> discoveredFindingIds = new(StringComparer.OrdinalIgnoreCase);
        string? cursor = null;
        const int take = 100;

        while (true)
        {
            (IReadOnlyList<RunSummary> items, bool hasMore, string? next) =
                await runDetailQueryService.ListRunSummariesKeysetAsync(cursor, take, cancellationToken).ConfigureAwait(false);

            if (items.Count == 0)
                break;

            foreach (RunSummary summary in items)
            {
                if (!IsCommittedSummary(summary))
                    continue;

                if (summary.CreatedUtc < windowStartUtc)
                    return discoveredFindingIds.Count;

                ArchitectureRunDetail? detail =
                    await runDetailQueryService.GetRunDetailAsync(summary.RunId, cancellationToken).ConfigureAwait(false);

                if (detail is null)
                    continue;

                IEnumerable<ArchitectureFinding> activeFindings = detail.Results
                    .SelectMany(static result => result.Findings)
                    .Where(static finding => !finding.IsMuted);

                foreach (ArchitectureFinding finding in ExecutiveRoiFindingDeduplicator.DeduplicateByStableIdentity(activeFindings))
                {
                    if (string.IsNullOrWhiteSpace(finding.FindingId))
                        continue;

                    discoveredFindingIds.Add(finding.FindingId.Trim());
                }
            }

            if (!hasMore || string.IsNullOrEmpty(next))
                break;

            cursor = next;
        }

        return discoveredFindingIds.Count;
    }

    private static bool IsCommittedSummary(RunSummary summary)
    {
        if (string.Equals(summary.Status, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            return true;

        return !string.IsNullOrWhiteSpace(summary.CurrentManifestVersion);
    }
}
