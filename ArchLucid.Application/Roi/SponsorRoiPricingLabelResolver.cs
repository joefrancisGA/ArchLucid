using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Roi;

namespace ArchLucid.Application.Roi;

/// <summary>Resolves sponsor-facing pricing basis labels for ROI summaries and exports.</summary>
public sealed class SponsorRoiPricingLabelResolver(
    SponsorRoiTenantPricingContextResolver tenantPricingContextResolver,
    RoiCostEvidenceFreshnessEvaluator roiCostEvidenceFreshnessEvaluator,
    RoiCostEvidenceCollectionResolver roiCostEvidenceCollectionResolver,
    IScopeContextProvider scopeContextProvider)
{
    private readonly SponsorRoiTenantPricingContextResolver _tenantPricingContextResolver =
        tenantPricingContextResolver ?? throw new ArgumentNullException(nameof(tenantPricingContextResolver));

    private readonly RoiCostEvidenceFreshnessEvaluator _roiCostEvidenceFreshnessEvaluator =
        roiCostEvidenceFreshnessEvaluator ?? throw new ArgumentNullException(nameof(roiCostEvidenceFreshnessEvaluator));

    private readonly RoiCostEvidenceCollectionResolver _roiCostEvidenceCollectionResolver =
        roiCostEvidenceCollectionResolver ?? throw new ArgumentNullException(nameof(roiCostEvidenceCollectionResolver));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task<SponsorRoiPricingLabels> ResolveAsync(
        IReadOnlyList<ArchitectureRunDetail> latestDetails,
        CancellationToken cancellationToken)
    {
        (decimal eaDiscountMultiplier, _) = await _tenantPricingContextResolver
            .ResolveAsync(cancellationToken)
            .ConfigureAwait(false);

        RoiCostEvidenceFreshnessSnapshot freshness = await _roiCostEvidenceFreshnessEvaluator
            .EvaluateAsync(cancellationToken)
            .ConfigureAwait(false);

        SponsorRoiCostFindingPricingSignalScanner.PricingSignals signals =
            SponsorRoiCostFindingPricingSignalScanner.Scan(latestDetails);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        bool hasExtractorPackages = await _roiCostEvidenceCollectionResolver
            .HasAnyUploadedInventoryPackagesAsync(scope, cancellationToken)
            .ConfigureAwait(false);

        bool hasUploadedCostEvidence = hasExtractorPackages || signals.HasUploadedExtractorEvidence;

        string savingsPricingBasis = SponsorRoiSavingsPricingBasis.Resolve(
            eaDiscountMultiplier,
            hasUploadedCostEvidence,
            signals.HasHeuristicCostEvidence);

        string savingsPricingBasisDescription = SponsorRoiSavingsPricingBasisDescriptionBuilder.Build(
            savingsPricingBasis,
            eaDiscountMultiplier,
            freshness);

        return new SponsorRoiPricingLabels(
            eaDiscountMultiplier,
            savingsPricingBasis,
            savingsPricingBasisDescription,
            freshness);
    }
}

/// <summary>Resolved sponsor ROI pricing labels for presentation.</summary>
public sealed record SponsorRoiPricingLabels(
    decimal EaDiscountMultiplier,
    string SavingsPricingBasis,
    string SavingsPricingBasisDescription,
    RoiCostEvidenceFreshnessSnapshot Freshness);
