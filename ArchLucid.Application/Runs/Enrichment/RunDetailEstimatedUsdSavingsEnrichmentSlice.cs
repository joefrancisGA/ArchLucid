using ArchLucid.Application.Roi;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Roi;

namespace ArchLucid.Application.Runs.Enrichment;

public sealed class RunDetailEstimatedUsdSavingsEnrichmentSlice(
    ITenantEstimatedUsdSavingsResolver tenantEstimatedUsdSavingsResolver,
    ITenantCostSettingsRepository tenantCostSettingsRepository) : IRunDetailEnrichmentSlice
{
    private readonly ITenantEstimatedUsdSavingsResolver _tenantEstimatedUsdSavingsResolver =
        tenantEstimatedUsdSavingsResolver ?? throw new ArgumentNullException(nameof(tenantEstimatedUsdSavingsResolver));

    private readonly ITenantCostSettingsRepository _tenantCostSettingsRepository =
        tenantCostSettingsRepository ?? throw new ArgumentNullException(nameof(tenantCostSettingsRepository));

    public async Task EnrichAsync(RunDetailEnrichmentContext context, CancellationToken cancellationToken)
    {
        context.Detail.EstimatedUsdSavingsSummary = await RunDetailEstimatedUsdSavingsBuilder
            .TryBuildAsync(
                context.Detail.Run,
                _tenantEstimatedUsdSavingsResolver,
                _tenantCostSettingsRepository,
                cancellationToken)
            .ConfigureAwait(false);
    }
}
