using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Roi;

/// <summary>
///     Builds deduplicated finding rows and environment savings slices for CSV export and charts.
/// </summary>
public sealed class SponsorRoiExportBuilder(
    SponsorRoiRunCollector runCollector,
    SponsorRoiPricingLabelResolver sponsorRoiPricingLabelResolver,
    IScopeContextProvider scopeContextProvider,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService)
{
    private readonly SponsorRoiRunCollector _runCollector =
        runCollector ?? throw new ArgumentNullException(nameof(runCollector));

    private readonly SponsorRoiPricingLabelResolver _sponsorRoiPricingLabelResolver =
        sponsorRoiPricingLabelResolver ?? throw new ArgumentNullException(nameof(sponsorRoiPricingLabelResolver));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    public async Task<SponsorRoiExportResponse> BuildExportAsync(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Dictionary<string, RunSummary> latestBySystem =
            await _runCollector.CollectLatestCommittedRunPerSystemAsync(cancellationToken).ConfigureAwait(false);
        List<RunSummary> selectedSummaries = latestBySystem.Values
            .OrderByDescending(static summary => summary.CreatedUtc)
            .Take(SponsorRoiRunCollector.DefaultSystemDetailCap)
            .ToList();

        List<(RunSummary Summary, ArchitectureRunDetail Detail)> loaded =
            await _runCollector.LoadRoiRunDetailsOrderedAsync(selectedSummaries, cancellationToken).ConfigureAwait(false);

        await SponsorRoiBoardPackSealedManifestGuard.EnsureRunIdsSealedOrThrowAsync(
            loaded.Select(static pair => pair.Summary.RunId),
            scope,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken).ConfigureAwait(false);

        List<ArchitectureRunDetail> latestDetails = loaded.Select(static pair => pair.Detail).ToList();

        List<SponsorRoiExportRow> rows = [];
        Dictionary<string, decimal> savingsByEnvironment = new(StringComparer.OrdinalIgnoreCase);

        foreach ((RunSummary summary, ArchitectureRunDetail detail) in loaded)
        {
            string systemName = SponsorRoiRunCollector.ResolveSystemName(summary, detail);
            string environment = SponsorRoiRunCollector.ResolveEnvironmentLabel(detail);

            IEnumerable<ArchitectureFinding> activeFindings = detail.Results
                .SelectMany(static result => result.Findings)
                .Where(static finding => !finding.IsMuted);

            IEnumerable<ArchitectureFinding> deduped = SponsorRoiFindingDeduplicator.DeduplicateByStableIdentity(activeFindings);

            foreach (ArchitectureFinding finding in deduped)
            {
                rows.Add(new SponsorRoiExportRow
                {
                    FindingId = finding.FindingId,
                    RunId = summary.RunId,
                    SystemName = systemName,
                    Environment = environment,
                    Category = SponsorRoiRunCollector.NormalizeCategory(finding.Category),
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

        List<SponsorRoiEnvironmentSavingsSlice> slices = savingsByEnvironment
            .OrderByDescending(static pair => pair.Value)
            .Select(static pair => new SponsorRoiEnvironmentSavingsSlice
            {
                Environment = pair.Key,
                EstimatedUsdSavings = pair.Value,
            })
            .ToList();

        SponsorRoiPricingLabels pricingLabels =
            await _sponsorRoiPricingLabelResolver.ResolveAsync(latestDetails, cancellationToken).ConfigureAwait(false);

        return new SponsorRoiExportResponse
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
}
