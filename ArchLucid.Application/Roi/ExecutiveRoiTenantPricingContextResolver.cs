using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Roi;

namespace ArchLucid.Application.Roi;

/// <summary>Reads tenant ROI cost settings for executive summary pricing-basis labels.</summary>
public sealed class ExecutiveRoiTenantPricingContextResolver(
    ITenantCostSettingsRepository tenantCostSettingsRepository,
    IScopeContextProvider scopeContextProvider)
{
    private readonly ITenantCostSettingsRepository _tenantCostSettingsRepository =
        tenantCostSettingsRepository ?? throw new ArgumentNullException(nameof(tenantCostSettingsRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task<(decimal EaDiscountMultiplier, string SavingsPricingBasis)> ResolveAsync(
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        TenantCostSettingsRecord? settings = await _tenantCostSettingsRepository
            .TryGetAsync(scope.TenantId, cancellationToken)
            .ConfigureAwait(false);

        decimal multiplier = NormalizeEaDiscountMultiplier(settings?.EaDiscountMultiplier);

        return (multiplier, ExecutiveRoiSavingsPricingBasis.Resolve(multiplier));
    }

    private static decimal NormalizeEaDiscountMultiplier(decimal? raw)
    {
        if (raw is null or <= 0m or > 1m)
            return 1.0m;

        return raw.Value;
    }
}
