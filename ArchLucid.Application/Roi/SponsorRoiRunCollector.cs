using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Roi;
using ArchLucid.Application.Governance;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Roi;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Roi;

/// <summary>
///     Shared fan-out and collection helpers for sponsor ROI summary builders.
/// </summary>
public sealed class SponsorRoiRunCollector(
    IRunDetailQueryService runDetailQueryService,
    ITenantEstimatedUsdSavingsResolver tenantEstimatedUsdSavingsResolver,
    IScopeContextProvider scopeContextProvider,
    IFindingReviewTrailRepository findingReviewTrailRepository,
    IRiskExceptionService riskExceptionService,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    ITenantCostSettingsRepository tenantCostSettingsRepository,
    IOptions<ValueReportComputationOptions> valueReportComputationOptions,
    ILogger<SponsorRoiRunCollector> logger)
{
    /// <summary>Max distinct systems whose run details are loaded per request (defense against huge tenants).</summary>
    public const int DefaultSystemDetailCap = 200;

    /// <summary>Bounded fan-out for <see cref="IRunDetailQueryService.GetRunDetailForRoiAsync"/> / savings resolution.</summary>
    private const int RunDetailRoiFanOutMaxConcurrent = 8;

    private const string UnspecifiedSystemName = "(unspecified)";

    private readonly ITenantEstimatedUsdSavingsResolver _tenantEstimatedUsdSavingsResolver =
        tenantEstimatedUsdSavingsResolver ?? throw new ArgumentNullException(nameof(tenantEstimatedUsdSavingsResolver));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IFindingReviewTrailRepository _findingReviewTrailRepository =
        findingReviewTrailRepository ?? throw new ArgumentNullException(nameof(findingReviewTrailRepository));

    private readonly IRiskExceptionService _riskExceptionService =
        riskExceptionService ?? throw new ArgumentNullException(nameof(riskExceptionService));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly ITenantCostSettingsRepository _tenantCostSettingsRepository =
        tenantCostSettingsRepository ?? throw new ArgumentNullException(nameof(tenantCostSettingsRepository));

    private readonly ValueReportComputationOptions _valueReportComputationOptions =
        valueReportComputationOptions?.Value ?? throw new ArgumentNullException(nameof(valueReportComputationOptions));

    private readonly ILogger<SponsorRoiRunCollector> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

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

    public async Task<SponsorRoiBasisBreakdown> BuildBasisBreakdownAsync(
        IReadOnlyList<ArchitectureRunDetail> latestDetails,
        Guid tenantId,
        Guid? projectId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        List<Guid> snapshotIds = latestDetails
            .Select(static detail => detail.Run.FindingsSnapshotId)
            .Where(static id => id is Guid snapshotId && snapshotId != Guid.Empty)
            .Select(static id => id!.Value)
            .Distinct()
            .ToList();

        FindingsSnapshot?[] snapshotSlots = snapshotIds.Count == 0
            ? []
            : await BoundedParallelMap.MapAsync(
                snapshotIds,
                RunDetailRoiFanOutMaxConcurrent,
                async (snapshotId, ct) =>
                    await _findingsSnapshotRepository
                        .GetByIdAsync(scope, snapshotId, ct)
                        .ConfigureAwait(false),
                cancellationToken).ConfigureAwait(false);

        List<FindingsSnapshot> snapshots = snapshotSlots
            .Where(static snapshot => snapshot is not null)
            .Select(static snapshot => snapshot!)
            .ToList();

        DateTimeOffset since = TimeProvider.System.UtcNowDateTime().Subtract(FindingDispositionTrailWindow.BasisBreakdownLookback);
        IReadOnlyList<FindingReviewEventRecord> trailEvents =
            await _findingReviewTrailRepository.ListSinceUtcAsync(tenantId, since, cancellationToken).ConfigureAwait(false);
        IReadOnlyList<RiskExceptionRecord> activeWaivers =
            await _riskExceptionService.ListActiveAsync(tenantId, projectId, cancellationToken).ConfigureAwait(false);
        TenantCostSettingsRecord? tenantSettings = await _tenantCostSettingsRepository
            .TryGetAsync(tenantId, cancellationToken)
            .ConfigureAwait(false);

        return DispositionAwareRoiBasisCalculator.Compute(
            snapshots,
            trailEvents,
            activeWaivers,
            tenantSettings,
            _valueReportComputationOptions);
    }

    public static List<SystemicIssueSummary> AggregateTopSystemicIssues(
        IReadOnlyList<ArchitectureRunDetail> latestDetails,
        ILogger? logger = null)
    {
        IReadOnlyList<ArchitectureFinding> deduped = CollectDedupedActiveFindings(latestDetails, logger);

        return deduped
            .GroupBy(static finding => (Category: NormalizeCategory(finding.Category), Severity: finding.Severity.ToString()))
            .Select(static group => new SystemicIssueSummary
            {
                Category = group.Key.Category,
                Severity = group.Key.Severity,
                Count = group.Count(),
            })
            .OrderByDescending(static issue => issue.Count)
            .ThenBy(static issue => issue.Category, StringComparer.OrdinalIgnoreCase)
            .ThenBy(static issue => issue.Severity, StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToList();
    }

    public static IReadOnlyList<ArchitectureFinding> CollectDedupedActiveFindings(
        IReadOnlyList<ArchitectureRunDetail> latestDetails,
        ILogger? logger = null)
    {
        IEnumerable<ArchitectureFinding> allFindings = latestDetails
            .SelectMany(static detail => detail.Results.SelectMany(static result => result.Findings));

        IEnumerable<ArchitectureFinding> muted = allFindings.Where(static finding => finding.IsMuted);

        if (logger is not null)
            SponsorRoiFindingExclusionLogger.LogMutedFindings(logger, muted);

        IEnumerable<ArchitectureFinding> activeFindings = allFindings.Where(static finding => !finding.IsMuted);

        IEnumerable<ArchitectureFinding> deduped = logger is null
            ? SponsorRoiFindingDeduplicator.DeduplicateByStableIdentity(activeFindings)
            : SponsorRoiFindingExclusionLogger.DeduplicateWithLogging(logger, activeFindings);

        return deduped.ToList();
    }

    /// <summary>
    ///     Authoritative portfolio headline: open + needs-evidence estimated USD (V1 §2.8).
    ///     Shared by single-tenant summary, board pack, and cross-tenant portfolio rollup.
    /// </summary>
    public static decimal ComputeHeadlineSavingsFromBasis(SponsorRoiBasisBreakdown basis)
    {
        ArgumentNullException.ThrowIfNull(basis);

        return basis.OpenEstimatedUsd + basis.NeedsEvidenceUsd;
    }

    public static bool IsCommittedSummary(RunSummary summary)
    {
        if (string.Equals(summary.Status, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            return true;

        return !string.IsNullOrWhiteSpace(summary.CurrentManifestVersion);
    }

    public static string ResolveSystemName(RunSummary summary, ArchitectureRunDetail detail)
    {
        if (!string.IsNullOrWhiteSpace(summary.SystemName))
            return summary.SystemName.Trim();

        if (!string.IsNullOrWhiteSpace(detail.Manifest?.SystemName))
            return detail.Manifest.SystemName.Trim();

        return UnspecifiedSystemName;
    }

    public static string ResolveEnvironmentLabel(ArchitectureRunDetail detail)
    {
        ArgumentNullException.ThrowIfNull(detail);

        foreach (ManifestService service in detail.Manifest?.Services ?? [])
        {
            foreach (string? tag in service.Tags)
            {
                if (tag is null)
                    continue;

                if (!TryParseEnvironmentTag(tag, out string environment))
                    continue;

                return environment;
            }
        }

        return "unspecified";
    }

    public static string NormalizeSystemName(string? systemName)
    {
        if (string.IsNullOrWhiteSpace(systemName))
            return UnspecifiedSystemName;

        return systemName.Trim();
    }

    public static string NormalizeCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category))
            return "(uncategorized)";

        return category.Trim();
    }

    private Task<decimal?> TryResolveEstimatedUsdSavingsAsync(Guid? findingsSnapshotId, CancellationToken cancellationToken) =>
        _tenantEstimatedUsdSavingsResolver.ResolveFromFindingsSnapshotIdAsync(findingsSnapshotId, cancellationToken);

    private static bool TryParseEnvironmentTag(string tag, out string environment)
    {
        environment = string.Empty;

        if (string.IsNullOrWhiteSpace(tag))
            return false;

        if (tag.StartsWith("env:", StringComparison.OrdinalIgnoreCase))
        {
            environment = tag["env:".Length..].Trim();
            return !string.IsNullOrWhiteSpace(environment);
        }

        if (tag.StartsWith("environment:", StringComparison.OrdinalIgnoreCase))
        {
            environment = tag["environment:".Length..].Trim();
            return !string.IsNullOrWhiteSpace(environment);
        }

        return false;
    }
}
