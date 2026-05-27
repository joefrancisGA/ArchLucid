using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Roi;
using ArchLucid.Application.Governance;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Roi;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Roi;

/// <inheritdoc cref="IExecutiveRoiSummaryService"/>
public sealed class ExecutiveRoiSummaryService(
    IRunDetailQueryService runDetailQueryService,
    ITenantEstimatedUsdSavingsResolver tenantEstimatedUsdSavingsResolver,
    ITenantRepository tenantRepository,
    IScimUserRepository scimUserRepository,
    ExecutiveRoiTenantPricingContextResolver executiveRoiTenantPricingContextResolver,
    RoiCostEvidenceFreshnessEvaluator roiCostEvidenceFreshnessEvaluator,
    IAzureExtractorPackageRepository azureExtractorPackageRepository,
    IScopeContextProvider scopeContextProvider,
    IFindingReviewTrailRepository findingReviewTrailRepository,
    IRiskExceptionService riskExceptionService,
    ITenantSettingsRepository tenantSettingsRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    ITenantCostSettingsRepository tenantCostSettingsRepository,
    IOptions<ValueReportComputationOptions> valueReportComputationOptions,
    ILogger<ExecutiveRoiSummaryService> logger) : IExecutiveRoiSummaryService
{
    /// <summary>Max distinct systems whose run details are loaded per request (defense against huge tenants).</summary>
    public const int DefaultSystemDetailCap = 200;

    private const string UnspecifiedSystemName = "(unspecified)";

    private readonly ITenantEstimatedUsdSavingsResolver _tenantEstimatedUsdSavingsResolver =
        tenantEstimatedUsdSavingsResolver ?? throw new ArgumentNullException(nameof(tenantEstimatedUsdSavingsResolver));

    private readonly ITenantRepository _tenantRepository = tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));
    private readonly IScimUserRepository _scimUserRepository = scimUserRepository ?? throw new ArgumentNullException(nameof(scimUserRepository));

    private readonly ILogger<ExecutiveRoiSummaryService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly ExecutiveRoiTenantPricingContextResolver _executiveRoiTenantPricingContextResolver =
        executiveRoiTenantPricingContextResolver ?? throw new ArgumentNullException(nameof(executiveRoiTenantPricingContextResolver));

    private readonly RoiCostEvidenceFreshnessEvaluator _roiCostEvidenceFreshnessEvaluator =
        roiCostEvidenceFreshnessEvaluator ?? throw new ArgumentNullException(nameof(roiCostEvidenceFreshnessEvaluator));

    private readonly IAzureExtractorPackageRepository _azureExtractorPackageRepository =
        azureExtractorPackageRepository ?? throw new ArgumentNullException(nameof(azureExtractorPackageRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IFindingReviewTrailRepository _findingReviewTrailRepository =
        findingReviewTrailRepository ?? throw new ArgumentNullException(nameof(findingReviewTrailRepository));

    private readonly IRiskExceptionService _riskExceptionService =
        riskExceptionService ?? throw new ArgumentNullException(nameof(riskExceptionService));

    private readonly ITenantSettingsRepository _tenantSettingsRepository =
        tenantSettingsRepository ?? throw new ArgumentNullException(nameof(tenantSettingsRepository));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly ITenantCostSettingsRepository _tenantCostSettingsRepository =
        tenantCostSettingsRepository ?? throw new ArgumentNullException(nameof(tenantCostSettingsRepository));

    private readonly ValueReportComputationOptions _valueReportComputationOptions =
        valueReportComputationOptions?.Value ?? throw new ArgumentNullException(nameof(valueReportComputationOptions));

    /// <inheritdoc/>
    public async Task<ExecutiveRoiSummaryResponse> BuildAsync(CancellationToken cancellationToken = default)
    {
        Dictionary<string, RunSummary> latestBySystem = await CollectLatestCommittedRunPerSystemAsync(cancellationToken).ConfigureAwait(false);
        List<RunSummary> selectedSummaries = latestBySystem.Values
            .OrderByDescending(static summary => summary.CreatedUtc)
            .Take(DefaultSystemDetailCap)
            .ToList();

        if (selectedSummaries.Count < latestBySystem.Count && _logger.IsEnabled(LogLevel.Warning))
        {
            _logger.LogWarning(
                "Executive ROI summary: loading details for {Loaded} of {Total} systems (cap {Cap}).",
                selectedSummaries.Count,
                latestBySystem.Count,
                DefaultSystemDetailCap);
        }

        List<SystemLatestRunRoi> systems = [];
        List<ArchitectureRunDetail> latestDetails = [];
        foreach (RunSummary summary in selectedSummaries)
        {
            ArchitectureRunDetail? detail = await _runDetailQueryService.GetRunDetailAsync(summary.RunId, cancellationToken).ConfigureAwait(false);

            if (detail is null)
                continue;

            latestDetails.Add(detail);
            decimal? savings = await TryResolveEstimatedUsdSavingsAsync(detail.Run.FindingsSnapshotId, cancellationToken).ConfigureAwait(false);
            systems.Add(new SystemLatestRunRoi
            {
                SystemName = ResolveSystemName(summary, detail),
                RunId = summary.RunId,
                CommittedUtc = detail.Manifest?.Metadata.CreatedUtc ?? detail.Run.CompletedUtc,
                EstimatedUsdSavings = savings,
            });
        }

        List<SystemicIssueSummary> topIssues = AggregateTopSystemicIssues(latestDetails, _logger);
        List<(RunSummary Summary, ArchitectureRunDetail Detail)> trendRuns =
            await CollectCommittedRunsForTrendsAsync(cancellationToken).ConfigureAwait(false);
        List<ExecutiveRoiSystemicIssueTrendSeries> historicalTrends =
            ExecutiveRoiSystemicIssueTrendBuilder.Build(trendRuns, TimeProvider.System);
        Guid tenantId = _scopeContextProvider.GetCurrentScope().TenantId;
        Guid? projectId = _scopeContextProvider.GetCurrentScope().ProjectId;

        ExecutiveRoiBasisBreakdown basisBreakdown = await BuildBasisBreakdownAsync(
            latestDetails,
            tenantId,
            projectId,
            cancellationToken).ConfigureAwait(false);

        decimal totalSavings = basisBreakdown.OpenEstimatedUsd + basisBreakdown.NeedsEvidenceUsd;
        (int resolvedCount, int newlyDiscoveredCount) =
            await ExecutiveRoiTrailing30DayMetricsCalculator.ComputeAsync(
                _runDetailQueryService,
                _findingReviewTrailRepository,
                tenantId,
                cancellationToken).ConfigureAwait(false);

        RealizedValueSummary realizedValue = await RealizedValueMetricsCalculator.ComputeAsync(
            _findingReviewTrailRepository,
            _riskExceptionService,
            _tenantSettingsRepository,
            tenantId,
            projectId,
            cancellationToken).ConfigureAwait(false);

        ExecutiveRoiPricingLabels pricingLabels =
            await ResolveExecutiveRoiPricingLabelsAsync(latestDetails, cancellationToken).ConfigureAwait(false);

        return new ExecutiveRoiSummaryResponse
        {
            TotalEstimatedUsdSavings = totalSavings,
            SystemCount = systems.Count,
            LatestRunCount = systems.Count,
            Systems = systems,
            TopSystemicIssues = topIssues,
            EaDiscountMultiplier = pricingLabels.EaDiscountMultiplier,
            SavingsPricingBasis = pricingLabels.SavingsPricingBasis,
            SavingsPricingBasisDescription = pricingLabels.SavingsPricingBasisDescription,
            CostEvidenceFreshnessStatus = pricingLabels.Freshness.Status,
            LatestCostEvidenceCollectionTimestampUtc = pricingLabels.Freshness.LatestCollectionTimestampUtc,
            CostEvidenceStaleAfterDays = pricingLabels.Freshness.StaleAfterDays,
            ResolvedFindingsCount30Days = resolvedCount,
            NewlyDiscoveredFindingsCount30Days = newlyDiscoveredCount,
            HistoricalTrends = historicalTrends,
            RealizedValue = realizedValue,
            BasisBreakdown = basisBreakdown,
        };
    }

    private async Task<ExecutiveRoiBasisBreakdown> BuildBasisBreakdownAsync(
        IReadOnlyList<ArchitectureRunDetail> latestDetails,
        Guid tenantId,
        Guid? projectId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        List<FindingsSnapshot> snapshots = [];

        foreach (ArchitectureRunDetail detail in latestDetails)
        {
            Guid? snapshotId = detail.Run.FindingsSnapshotId;

            if (snapshotId is null || snapshotId == Guid.Empty)
                continue;

            FindingsSnapshot? snapshot = await _findingsSnapshotRepository
                .GetByIdAsync(scope, snapshotId.Value, cancellationToken)
                .ConfigureAwait(false);

            if (snapshot is not null)
                snapshots.Add(snapshot);
        }

        DateTimeOffset since = TimeProvider.System.UtcNowDateTime().Subtract(RealizedValueMetricsCalculator.TrailingWindow);
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

    public async Task<CrossTenantPortfolioSummaryResponse> GetCrossTenantPortfolioSummaryAsync(string userDirectoryKey, CancellationToken cancellationToken = default)
    {
        IReadOnlyList<TenantRecord> allTenants = await _tenantRepository.ListAsync(cancellationToken).ConfigureAwait(false);
        List<Guid> accessibleTenantIds = [];

        foreach (TenantRecord tenant in allTenants)
        {
            if (tenant.SuspendedUtc is not null || tenant.OffboardedUtc is not null)
                continue;

            ScimUserRecord? user = await _scimUserRepository.GetByExternalIdAsync(tenant.Id, userDirectoryKey, cancellationToken).ConfigureAwait(false);
            if (user is not null && user.DirectoryRemovedUtc is null && user.Active)
            {
                accessibleTenantIds.Add(tenant.Id);
            }
        }

        if (accessibleTenantIds.Count < 5)
        {
            return new CrossTenantPortfolioSummaryResponse
            {
                IsKAnonymitySatisfied = false
            };
        }

        decimal totalSavings = 0m;
        int totalSystems = 0;
        int totalCriticalFindings = 0;
        List<SystemicIssueSummary> allIssues = [];

        foreach (Guid tenantId in accessibleTenantIds)
        {
            using IDisposable overrideScope = AmbientScopeContext.Push(new ScopeContext { TenantId = tenantId });

            Dictionary<string, RunSummary> latestBySystem = await CollectLatestCommittedRunPerSystemAsync(cancellationToken).ConfigureAwait(false);
            List<RunSummary> selectedSummaries = latestBySystem.Values
                .OrderByDescending(static summary => summary.CreatedUtc)
                .Take(DefaultSystemDetailCap)
                .ToList();

            List<ArchitectureRunDetail> latestDetails = [];
            foreach (RunSummary summary in selectedSummaries)
            {
                ArchitectureRunDetail? detail = await _runDetailQueryService.GetRunDetailAsync(summary.RunId, cancellationToken).ConfigureAwait(false);

                if (detail is null)
                    continue;

                latestDetails.Add(detail);
                decimal? savings = await TryResolveEstimatedUsdSavingsAsync(detail.Run.FindingsSnapshotId, cancellationToken).ConfigureAwait(false);
                totalSavings += savings ?? 0m;
            }

            totalSystems += latestDetails.Count;

            IEnumerable<ArchitectureFinding> allFindings = latestDetails
                .SelectMany(static detail => detail.Results.SelectMany(static result => result.Findings));

            ExecutiveRoiFindingExclusionLogger.LogMutedFindings(_logger, allFindings.Where(static f => f.IsMuted));

            IEnumerable<ArchitectureFinding> activeFindings = allFindings.Where(static finding => !finding.IsMuted);

            IEnumerable<ArchitectureFinding> deduped =
                ExecutiveRoiFindingExclusionLogger.DeduplicateWithLogging(_logger, activeFindings);

            totalCriticalFindings += deduped.Count(static f => string.Equals(f.Severity.ToString(), "Critical", StringComparison.OrdinalIgnoreCase));

            IEnumerable<SystemicIssueSummary> issues = deduped
                .GroupBy(static finding => (Category: NormalizeCategory(finding.Category), Severity: finding.Severity.ToString()))
                .Select(static group => new SystemicIssueSummary
                {
                    Category = group.Key.Category,
                    Severity = group.Key.Severity,
                    Count = group.Count(),
                });

            allIssues.AddRange(issues);
        }

        List<SystemicIssueSummary> topIssues = allIssues
            .GroupBy(static issue => (issue.Category, issue.Severity))
            .Select(static group => new SystemicIssueSummary
            {
                Category = group.Key.Category,
                Severity = group.Key.Severity,
                Count = group.Sum(static i => i.Count),
            })
            .OrderByDescending(static issue => issue.Count)
            .ThenBy(static issue => issue.Category, StringComparer.OrdinalIgnoreCase)
            .ThenBy(static issue => issue.Severity, StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToList();

        return new CrossTenantPortfolioSummaryResponse
        {
            IsKAnonymitySatisfied = true,
            TotalEstimatedUsdSavings = totalSavings,
            TotalSystemCount = totalSystems,
            TotalCriticalFindings = totalCriticalFindings,
            TopSystemicIssues = topIssues,
        };
    }

    /// <inheritdoc />
    public async Task<ExecutiveRoiHistoryResponse> BuildHistoryAsync(CancellationToken cancellationToken = default)
    {
        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        DateTime windowStart = utcNow.AddMonths(-6);

        Dictionary<string, (decimal Savings, int CriticalCount, DateTime LatestUtc)> buckets =
            new(StringComparer.Ordinal);

        string? cursor = null;
        const int take = 100;

        while (true)
        {
            (IReadOnlyList<RunSummary> items, bool hasMore, string? next) =
                await _runDetailQueryService.ListRunSummariesKeysetAsync(cursor, take, cancellationToken).ConfigureAwait(false);

            foreach (RunSummary summary in items)
            {
                if (!IsCommittedSummary(summary))
                    continue;

                if (summary.CreatedUtc < windowStart)
                    continue;

                string monthKey = summary.CreatedUtc.ToString("yyyy-MM", System.Globalization.CultureInfo.InvariantCulture);
                ArchitectureRunDetail? detail = await _runDetailQueryService.GetRunDetailAsync(summary.RunId, cancellationToken).ConfigureAwait(false);

                if (detail is null)
                    continue;

                decimal? savings = await TryResolveEstimatedUsdSavingsAsync(detail.Run.FindingsSnapshotId, cancellationToken).ConfigureAwait(false);
                int criticalCount = detail.Results
                    .SelectMany(static result => result.Findings)
                    .Count(static finding => !finding.IsMuted
                        && string.Equals(finding.Severity.ToString(), "Critical", StringComparison.OrdinalIgnoreCase));

                if (!buckets.TryGetValue(monthKey, out (decimal Savings, int CriticalCount, DateTime LatestUtc) existing))
                {
                    buckets[monthKey] = (savings ?? 0m, criticalCount, summary.CreatedUtc);
                    continue;
                }

                decimal mergedSavings = existing.Savings + (savings ?? 0m);
                int mergedCritical = existing.CriticalCount + criticalCount;
                DateTime latestUtc = summary.CreatedUtc > existing.LatestUtc ? summary.CreatedUtc : existing.LatestUtc;
                buckets[monthKey] = (mergedSavings, mergedCritical, latestUtc);
            }

            if (!hasMore || string.IsNullOrEmpty(next))
                break;

            cursor = next;
        }

        List<ExecutiveRoiHistoryPoint> points = buckets
            .OrderBy(static pair => pair.Key, StringComparer.Ordinal)
            .Select(static pair => new ExecutiveRoiHistoryPoint
            {
                SnapshotUtc = new DateTimeOffset(pair.Value.LatestUtc, TimeSpan.Zero),
                TotalEstimatedUsdSavings = pair.Value.Savings,
                CriticalSecurityFindings = pair.Value.CriticalCount,
            })
            .ToList();

        return new ExecutiveRoiHistoryResponse { Points = points };
    }

    /// <inheritdoc />
    public async Task<ExecutiveRoiExportResponse> BuildExportAsync(CancellationToken cancellationToken = default)
    {
        Dictionary<string, RunSummary> latestBySystem = await CollectLatestCommittedRunPerSystemAsync(cancellationToken).ConfigureAwait(false);
        List<RunSummary> selectedSummaries = latestBySystem.Values
            .OrderByDescending(static summary => summary.CreatedUtc)
            .Take(DefaultSystemDetailCap)
            .ToList();

        List<ExecutiveRoiExportRow> rows = [];
        Dictionary<string, decimal> savingsByEnvironment = new(StringComparer.OrdinalIgnoreCase);
        List<ArchitectureRunDetail> latestDetails = [];

        foreach (RunSummary summary in selectedSummaries)
        {
            ArchitectureRunDetail? detail = await _runDetailQueryService.GetRunDetailAsync(summary.RunId, cancellationToken).ConfigureAwait(false);

            if (detail is null)
                continue;

            latestDetails.Add(detail);
            string systemName = ResolveSystemName(summary, detail);
            string environment = ResolveEnvironmentLabel(detail);

            IEnumerable<ArchitectureFinding> activeFindings = detail.Results
                .SelectMany(static result => result.Findings)
                .Where(static finding => !finding.IsMuted);

            IEnumerable<ArchitectureFinding> deduped = ExecutiveRoiFindingDeduplicator.DeduplicateByStableIdentity(activeFindings);

            foreach (ArchitectureFinding finding in deduped)
            {
                rows.Add(new ExecutiveRoiExportRow
                {
                    FindingId = finding.FindingId,
                    RunId = summary.RunId,
                    SystemName = systemName,
                    Environment = environment,
                    Category = NormalizeCategory(finding.Category),
                    Severity = finding.Severity.ToString(),
                    Title = finding.Message,
                    AffectedResource = finding.EvidenceRefs.FirstOrDefault(),
                    EstimatedUsdSavings = finding.EstimatedUsdSavings,
                });

                if (finding.EstimatedUsdSavings is > 0m)
                {
                    savingsByEnvironment.TryGetValue(environment, out decimal existing);
                    savingsByEnvironment[environment] = existing + finding.EstimatedUsdSavings.Value;
                }
            }
        }

        List<ExecutiveRoiEnvironmentSavingsSlice> slices = savingsByEnvironment
            .OrderByDescending(static pair => pair.Value)
            .Select(static pair => new ExecutiveRoiEnvironmentSavingsSlice
            {
                Environment = pair.Key,
                EstimatedUsdSavings = pair.Value,
            })
            .ToList();

        ExecutiveRoiPricingLabels pricingLabels =
            await ResolveExecutiveRoiPricingLabelsAsync(latestDetails, cancellationToken).ConfigureAwait(false);

        return new ExecutiveRoiExportResponse
        {
            Rows = rows,
            SavingsByEnvironment = slices,
            EaDiscountMultiplier = pricingLabels.EaDiscountMultiplier,
            SavingsPricingBasis = pricingLabels.SavingsPricingBasis,
            SavingsPricingBasisDescription = pricingLabels.SavingsPricingBasisDescription,
            CostEvidenceFreshnessStatus = pricingLabels.Freshness.Status,
            LatestCostEvidenceCollectionTimestampUtc = pricingLabels.Freshness.LatestCollectionTimestampUtc,
            CostEvidenceStaleAfterDays = pricingLabels.Freshness.StaleAfterDays,
        };
    }

    private async Task<ExecutiveRoiPricingLabels> ResolveExecutiveRoiPricingLabelsAsync(
        IReadOnlyList<ArchitectureRunDetail> latestDetails,
        CancellationToken cancellationToken)
    {
        (decimal eaDiscountMultiplier, _) = await _executiveRoiTenantPricingContextResolver
            .ResolveAsync(cancellationToken)
            .ConfigureAwait(false);

        RoiCostEvidenceFreshnessSnapshot freshness = await _roiCostEvidenceFreshnessEvaluator
            .EvaluateAsync(cancellationToken)
            .ConfigureAwait(false);

        ExecutiveRoiCostFindingPricingSignalScanner.PricingSignals signals =
            ExecutiveRoiCostFindingPricingSignalScanner.Scan(latestDetails);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        bool hasExtractorPackages = await _azureExtractorPackageRepository
            .HasAnyInWorkspaceAsync(scope, cancellationToken)
            .ConfigureAwait(false);

        bool hasUploadedCostEvidence = hasExtractorPackages || signals.HasUploadedExtractorEvidence;

        string savingsPricingBasis = ExecutiveRoiSavingsPricingBasis.Resolve(
            eaDiscountMultiplier,
            hasUploadedCostEvidence,
            signals.HasHeuristicCostEvidence);

        string savingsPricingBasisDescription = ExecutiveRoiSavingsPricingBasisDescriptionBuilder.Build(
            savingsPricingBasis,
            eaDiscountMultiplier,
            freshness);

        return new ExecutiveRoiPricingLabels(
            eaDiscountMultiplier,
            savingsPricingBasis,
            savingsPricingBasisDescription,
            freshness);
    }

    private sealed record ExecutiveRoiPricingLabels(
        decimal EaDiscountMultiplier,
        string SavingsPricingBasis,
        string SavingsPricingBasisDescription,
        RoiCostEvidenceFreshnessSnapshot Freshness);

    private async Task<List<(RunSummary Summary, ArchitectureRunDetail Detail)>> CollectCommittedRunsForTrendsAsync(
        CancellationToken cancellationToken)
    {
        const int maxRuns = 400;
        DateTime cutoffUtc = TimeProvider.System.GetUtcNow().UtcDateTime.AddMonths(-6);
        List<(RunSummary Summary, ArchitectureRunDetail Detail)> results = [];
        string? cursor = null;
        const int take = 100;

        while (results.Count < maxRuns)
        {
            (IReadOnlyList<RunSummary> items, bool hasMore, string? next) =
                await _runDetailQueryService.ListRunSummariesKeysetAsync(cursor, take, cancellationToken).ConfigureAwait(false);

            foreach (RunSummary summary in items)
            {
                if (results.Count >= maxRuns)
                    break;

                if (!IsCommittedSummary(summary) || summary.CreatedUtc < cutoffUtc)
                    continue;

                ArchitectureRunDetail? detail =
                    await _runDetailQueryService.GetRunDetailAsync(summary.RunId, cancellationToken).ConfigureAwait(false);

                if (detail is null)
                    continue;

                results.Add((summary, detail));
            }

            if (!hasMore || string.IsNullOrEmpty(next))
                break;

            cursor = next;
        }

        return results;
    }

    private async Task<Dictionary<string, RunSummary>> CollectLatestCommittedRunPerSystemAsync(CancellationToken cancellationToken)
    {
        Dictionary<string, RunSummary> latestBySystem = new(StringComparer.OrdinalIgnoreCase);
        string? cursor = null;
        const int take = 100;

        while (true)
        {
            (IReadOnlyList<RunSummary> items, bool hasMore, string? next) =
                await _runDetailQueryService.ListRunSummariesKeysetAsync(cursor, take, cancellationToken).ConfigureAwait(false);

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

    private static List<SystemicIssueSummary> AggregateTopSystemicIssues(
        IReadOnlyList<ArchitectureRunDetail> latestDetails,
        ILogger? logger = null)
    {
        IEnumerable<ArchitectureFinding> allFindings = latestDetails
            .SelectMany(static detail => detail.Results.SelectMany(static result => result.Findings));

        IEnumerable<ArchitectureFinding> muted = allFindings.Where(static finding => finding.IsMuted);

        if (logger is not null)
            ExecutiveRoiFindingExclusionLogger.LogMutedFindings(logger, muted);

        IEnumerable<ArchitectureFinding> activeFindings = allFindings.Where(static finding => !finding.IsMuted);

        IEnumerable<ArchitectureFinding> deduped = logger is null
            ? ExecutiveRoiFindingDeduplicator.DeduplicateByStableIdentity(activeFindings)
            : ExecutiveRoiFindingExclusionLogger.DeduplicateWithLogging(logger, activeFindings);

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

    private Task<decimal?> TryResolveEstimatedUsdSavingsAsync(Guid? findingsSnapshotId, CancellationToken cancellationToken) =>
        _tenantEstimatedUsdSavingsResolver.ResolveFromFindingsSnapshotIdAsync(findingsSnapshotId, cancellationToken);

    private static bool IsCommittedSummary(RunSummary summary)
    {
        if (string.Equals(summary.Status, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            return true;

        return !string.IsNullOrWhiteSpace(summary.CurrentManifestVersion);
    }

    private static string ResolveSystemName(RunSummary summary, ArchitectureRunDetail detail)
    {
        if (!string.IsNullOrWhiteSpace(summary.SystemName))
            return summary.SystemName.Trim();

        if (!string.IsNullOrWhiteSpace(detail.Manifest?.SystemName))
            return detail.Manifest.SystemName.Trim();

        return UnspecifiedSystemName;
    }

    private static string ResolveEnvironmentLabel(ArchitectureRunDetail detail)
    {
        foreach (ManifestService service in detail.Manifest?.Services ?? [])
        {
            foreach (string tag in service.Tags)
            {
                if (!TryParseEnvironmentTag(tag, out string environment))
                    continue;

                return environment;
            }
        }

        return "unspecified";
    }

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

    private static string NormalizeSystemName(string? systemName)
    {
        if (string.IsNullOrWhiteSpace(systemName))
            return UnspecifiedSystemName;

        return systemName.Trim();
    }

    private static string NormalizeCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category))
            return "(uncategorized)";

        return category.Trim();
    }
}
