using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Roi;
using ArchLucid.Application.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Pilots;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Roi;

/// <summary>
///     Builds the cross-run sponsor ROI summary for the current tenant scope.
/// </summary>
public sealed class SponsorRoiSummaryBuilder(
    SponsorRoiRunCollector runCollector,
    SponsorRoiPricingLabelResolver sponsorRoiPricingLabelResolver,
    IScopeContextProvider scopeContextProvider,
    IFindingReviewTrailRepository findingReviewTrailRepository,
    IRiskExceptionService riskExceptionService,
    IArchitectureRiskRegisterService architectureRiskRegisterService,
    ITenantSettingsRepository tenantSettingsRepository,
    IRunDetailQueryService runDetailQueryService,
    IPilotScorecardMetricsReader pilotScorecardMetricsReader,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    ILogger<SponsorRoiSummaryBuilder> logger)
{
    private readonly SponsorRoiRunCollector _runCollector =
        runCollector ?? throw new ArgumentNullException(nameof(runCollector));

    private readonly SponsorRoiPricingLabelResolver _sponsorRoiPricingLabelResolver =
        sponsorRoiPricingLabelResolver ?? throw new ArgumentNullException(nameof(sponsorRoiPricingLabelResolver));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IFindingReviewTrailRepository _findingReviewTrailRepository =
        findingReviewTrailRepository ?? throw new ArgumentNullException(nameof(findingReviewTrailRepository));

    private readonly IRiskExceptionService _riskExceptionService =
        riskExceptionService ?? throw new ArgumentNullException(nameof(riskExceptionService));

    private readonly IArchitectureRiskRegisterService _architectureRiskRegisterService =
        architectureRiskRegisterService ?? throw new ArgumentNullException(nameof(architectureRiskRegisterService));

    private readonly ITenantSettingsRepository _tenantSettingsRepository =
        tenantSettingsRepository ?? throw new ArgumentNullException(nameof(tenantSettingsRepository));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IPilotScorecardMetricsReader _pilotScorecardMetricsReader =
        pilotScorecardMetricsReader ?? throw new ArgumentNullException(nameof(pilotScorecardMetricsReader));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly ILogger<SponsorRoiSummaryBuilder> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<SponsorRoiSummaryResponse> BuildAsync(CancellationToken cancellationToken = default)
    {
        Dictionary<string, RunSummary> latestBySystem =
            await _runCollector.CollectLatestCommittedRunPerSystemAsync(cancellationToken).ConfigureAwait(false);
        List<RunSummary> selectedSummaries = latestBySystem.Values
            .OrderByDescending(static summary => summary.CreatedUtc)
            .Take(SponsorRoiRunCollector.DefaultSystemDetailCap)
            .ToList();

        if (selectedSummaries.Count < latestBySystem.Count && _logger.IsEnabled(LogLevel.Warning))
        {
            _logger.LogWarning(
                "Sponsor ROI summary: loading details for {Loaded} of {Total} systems (cap {Cap}).",
                selectedSummaries.Count,
                latestBySystem.Count,
                SponsorRoiRunCollector.DefaultSystemDetailCap);
        }

        List<(RunSummary Summary, ArchitectureRunDetail Detail)> loaded =
            await _runCollector.LoadRoiRunDetailsOrderedAsync(selectedSummaries, cancellationToken).ConfigureAwait(false);
        List<ArchitectureRunDetail> latestDetails = loaded.Select(static pair => pair.Detail).ToList();
        decimal?[] savingsSlots =
            await _runCollector.ResolveEstimatedUsdSavingsOrderedAsync(latestDetails, cancellationToken).ConfigureAwait(false);

        List<SystemLatestRunRoi> systems = [];

        for (int index = 0; index < loaded.Count; index++)
        {
            (RunSummary summary, ArchitectureRunDetail detail) = loaded[index];
            systems.Add(new SystemLatestRunRoi
            {
                SystemName = SponsorRoiRunCollector.ResolveSystemName(summary, detail),
                RunId = summary.RunId,
                CommittedUtc = detail.Manifest?.Metadata.CreatedUtc ?? detail.Run.CompletedUtc,
                EstimatedUsdSavings = savingsSlots[index],
            });
        }

        List<SystemicIssueSummary> topIssues = SponsorRoiRunCollector.AggregateTopSystemicIssues(latestDetails, _logger);
        List<(RunSummary Summary, ArchitectureRunDetail Detail)> trendRuns =
            await _runCollector.CollectCommittedRunsForTrendsAsync(cancellationToken).ConfigureAwait(false);
        List<SponsorRoiSystemicIssueTrendSeries> historicalTrends =
            SponsorRoiSystemicIssueTrendBuilder.Build(trendRuns, TimeProvider.System);
        Guid tenantId = _scopeContextProvider.GetCurrentScope().TenantId;
        Guid workspaceId = _scopeContextProvider.GetCurrentScope().WorkspaceId;
        Guid? projectId = _scopeContextProvider.GetCurrentScope().ProjectId;

        SponsorRoiBasisBreakdown basisBreakdown = await _runCollector.BuildBasisBreakdownAsync(
            latestDetails,
            tenantId,
            projectId,
            cancellationToken).ConfigureAwait(false);

        decimal totalSavings = SponsorRoiRunCollector.ComputeHeadlineSavingsFromBasis(basisBreakdown);
        (int resolvedCount, int newlyDiscoveredCount) =
            await SponsorRoiTrailing30DayMetricsCalculator.ComputeAsync(
                _runDetailQueryService,
                _findingReviewTrailRepository,
                tenantId,
                cancellationToken).ConfigureAwait(false);

        RealizedValueSummary realizedValue = await RealizedValueMetricsCalculator.ComputeAsync(
            _findingReviewTrailRepository,
            _riskExceptionService,
            _tenantSettingsRepository,
            tenantId,
            workspaceId,
            projectId,
            cancellationToken).ConfigureAwait(false);

        SponsorRoiPricingLabels pricingLabels =
            await _sponsorRoiPricingLabelResolver.ResolveAsync(latestDetails, cancellationToken).ConfigureAwait(false);

        IReadOnlyList<RiskExceptionRecord> activeWaiversForExpiry = GovernanceWaiverExpiryWindow.FilterToScope(
            await _riskExceptionService.ListActiveAsync(tenantId, projectId, cancellationToken).ConfigureAwait(false),
            workspaceId,
            projectId);

        int expiringWaivers14Days = GovernanceWaiverExpiryWindow.CountExpiringWithinDays(
            activeWaiversForExpiry,
            TimeProvider.System.UtcNowDateTime(),
            GovernanceWaiverExpiryWindow.DefaultExpiringWithinDays);
        SponsorOrphanCandidateSummary orphanCandidates =
            SponsorOrphanCandidateKpiCalculator.BuildFromLatestDetails(latestDetails);

        IReadOnlyList<ArchitectureFinding> dedupedFindings =
            SponsorRoiRunCollector.CollectDedupedActiveFindings(latestDetails, _logger);

        SponsorBusinessImpactCategoryCounts businessImpactCategoryCounts =
            SponsorBusinessImpactCategoryClassifier.Build(dedupedFindings);

        ArchitectureRiskRegisterResponse riskRegister = await _architectureRiskRegisterService
            .GetRegisterAsync(tenantId, workspaceId, projectId, maxRows: 100, options: null, cancellationToken)
            .ConfigureAwait(false);

        int staleArchitectureRiskCount = StaleArchitectureRiskCountCalculator.CountStale(riskRegister);

        PilotScorecardTenantMetrics? pilotMetrics =
            await _pilotScorecardMetricsReader.GetAsync(tenantId, cancellationToken).ConfigureAwait(false);

        DateTime? firstCommitUtc = pilotMetrics?.FirstCommitUtc?.UtcDateTime;

        SponsorRoiSummaryResponse response = new()
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
            ExpiringWaiversCount14Days = expiringWaivers14Days,
            StaleArchitectureRiskCount = staleArchitectureRiskCount,
            OrphanCandidates = orphanCandidates,
            BusinessImpactCategoryCounts = businessImpactCategoryCounts,
            FirstCommitUtc = firstCommitUtc,
        };

        RoiSponsorFacingScopeLabeler.ApplySponsorRoiSummary(response);

        ScopeContext sealedScope = _scopeContextProvider.GetCurrentScope();

        await SponsorRoiBoardPackSealedManifestGuard.EnsureSummaryRunsSealedOrThrowAsync(
            response,
            sealedScope,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken).ConfigureAwait(false);

        return response;
    }
}
