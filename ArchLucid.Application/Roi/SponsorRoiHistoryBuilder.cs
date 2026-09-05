using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Roi;

/// <summary>
///     Builds monthly sponsor ROI snapshots for trend charts (last six months).
/// </summary>
public sealed class SponsorRoiHistoryBuilder(
    SponsorRoiRunCollector runCollector,
    IRunDetailQueryService runDetailQueryService,
    IScopeContextProvider scopeContextProvider,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    ILogger<SponsorRoiHistoryBuilder> logger)
{
    private readonly SponsorRoiRunCollector _runCollector =
        runCollector ?? throw new ArgumentNullException(nameof(runCollector));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly ILogger<SponsorRoiHistoryBuilder> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<SponsorRoiHistoryResponse> BuildHistoryAsync(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        DateTime windowStart = utcNow.AddMonths(-6);

        Dictionary<string, SponsorRoiHistoryMonthAggregate> buckets =
            new(StringComparer.Ordinal);

        string? cursor = null;
        const int take = 100;
        // Safety cap: history only needs the last 6 months; 2 000 pages ≈ 200 000 runs.
        const int maxPages = 2_000;
        int pageCount = 0;

        while (true)
        {
            if (pageCount >= maxPages)
            {
                _logger.LogWarning(
                    "BuildHistoryAsync: safety max-page cap ({Cap}) reached; stopping early.",
                    maxPages);
                break;
            }

            (IReadOnlyList<RunSummary> items, bool hasMore, string? next) =
                await _runDetailQueryService.ListRunSummariesKeysetAsync(cursor, take, cancellationToken).ConfigureAwait(false);

            pageCount++;

            List<RunSummary> pageCandidates = [];

            foreach (RunSummary summary in items)
            {
                if (!SponsorRoiRunCollector.IsCommittedSummary(summary))
                    continue;

                if (summary.CreatedUtc < windowStart)
                    continue;

                pageCandidates.Add(summary);
            }

            List<(RunSummary Summary, ArchitectureRunDetail Detail)> loaded =
                await _runCollector.LoadRoiRunDetailsOrderedAsync(pageCandidates, cancellationToken).ConfigureAwait(false);

            await SponsorRoiBoardPackSealedManifestGuard.EnsureRunIdsSealedOrThrowAsync(
                loaded.Select(static pair => pair.Summary.RunId),
                scope,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken).ConfigureAwait(false);

            List<ArchitectureRunDetail> pageDetails = loaded.Select(static pair => pair.Detail).ToList();
            decimal?[] savingsSlots =
                await _runCollector.ResolveEstimatedUsdSavingsOrderedAsync(pageDetails, cancellationToken).ConfigureAwait(false);

            for (int index = 0; index < loaded.Count; index++)
            {
                (RunSummary summary, ArchitectureRunDetail detail) = loaded[index];
                string monthKey = summary.CreatedUtc.ToString("yyyy-MM", System.Globalization.CultureInfo.InvariantCulture);
                decimal? savings = savingsSlots[index];
                int criticalCount = detail.Results
                    .SelectMany(static result => result.Findings)
                    .Count(static finding => !finding.IsMuted
                        && string.Equals(finding.Severity.ToString(), "Critical", StringComparison.OrdinalIgnoreCase));

                if (!buckets.TryGetValue(monthKey, out SponsorRoiHistoryMonthAggregate? existing))
                {
                    SponsorRoiHistoryMonthAggregate created = new()
                    {
                        Savings = savings ?? 0m,
                        CriticalCount = criticalCount,
                        LatestUtc = summary.CreatedUtc,
                    };

                    ApplyRunModeToAggregate(created, detail);

                    buckets[monthKey] = created;
                    continue;
                }

                existing.Savings += savings ?? 0m;
                existing.CriticalCount += criticalCount;

                if (summary.CreatedUtc > existing.LatestUtc)
                {
                    existing.LatestUtc = summary.CreatedUtc;
                }

                ApplyRunModeToAggregate(existing, detail);
            }

            if (!hasMore || string.IsNullOrEmpty(next))
                break;

            cursor = next;
        }

        List<SponsorRoiHistoryPoint> points = buckets
            .OrderBy(static pair => pair.Key, StringComparer.Ordinal)
            .Select(static pair =>
            {
                SponsorRoiHistoryMonthAggregate aggregate = pair.Value;

                return new SponsorRoiHistoryPoint
                {
                    SnapshotUtc = new DateTimeOffset(aggregate.LatestUtc, TimeSpan.Zero),
                    TotalEstimatedUsdSavings = aggregate.Savings,
                    CriticalSecurityFindings = aggregate.CriticalCount,
                    RealRunCount = aggregate.RealRunCount,
                    SimulatorRunCount = aggregate.SimulatorRunCount,
                    RealModeSavingsUsd = SponsorRoiHistoryRunModeCalculator.ComputeRealModeSavingsUsd(
                        aggregate.Savings,
                        aggregate.RealRunCount,
                        aggregate.SimulatorRunCount),
                    IsMixedMode = SponsorRoiHistoryRunModeCalculator.IsMixedMode(
                        aggregate.RealRunCount,
                        aggregate.SimulatorRunCount),
                };
            })
            .ToList();

        return new SponsorRoiHistoryResponse { Points = points };
    }

    private static void ApplyRunModeToAggregate(SponsorRoiHistoryMonthAggregate aggregate, ArchitectureRunDetail detail)
    {
        if (SponsorRoiHistoryRunModeCalculator.IsRealMode(detail.Run.StructuralExecutionMode))
        {
            aggregate.RealRunCount += 1;

            return;
        }

        aggregate.SimulatorRunCount += 1;
    }
}
