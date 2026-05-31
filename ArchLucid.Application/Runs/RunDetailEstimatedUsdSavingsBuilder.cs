using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Roi;
using ArchLucid.Contracts.Runs;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Roi;

namespace ArchLucid.Application.Runs;

/// <summary>Builds per-run savings read-models using the executive ROI resolver.</summary>
public static class RunDetailEstimatedUsdSavingsBuilder
{
    public static async Task<RunEstimatedUsdSavingsDto?> TryBuildAsync(
        RunRecord run,
        ITenantEstimatedUsdSavingsResolver tenantEstimatedUsdSavingsResolver,
        ITenantCostSettingsRepository tenantCostSettingsRepository,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(tenantEstimatedUsdSavingsResolver);
        ArgumentNullException.ThrowIfNull(tenantCostSettingsRepository);

        decimal? savings = await tenantEstimatedUsdSavingsResolver
            .ResolveFromFindingsSnapshotIdAsync(run.FindingsSnapshotId, cancellationToken)
            .ConfigureAwait(false);

        if (savings is not > 0m)
            return null;

        TenantCostSettingsRecord? tenantSettings = await tenantCostSettingsRepository
            .TryGetAsync(run.TenantId, cancellationToken)
            .ConfigureAwait(false);

        decimal eaDiscountMultiplier = tenantSettings?.EaDiscountMultiplier ?? 1.0m;
        string savingsPricingBasis = ExecutiveRoiSavingsPricingBasis.Resolve(eaDiscountMultiplier);

        return new RunEstimatedUsdSavingsDto
        {
            EstimatedUsdSavings = savings,
            SavingsPricingBasis = savingsPricingBasis,
            SavingsPricingBasisDescription =
                "Tenant-adjusted sum of cost-category findings for this run (same resolver as executive ROI rollup).",
        };
    }
}
