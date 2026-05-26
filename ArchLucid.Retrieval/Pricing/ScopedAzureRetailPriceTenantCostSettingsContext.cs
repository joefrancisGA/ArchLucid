using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Roi;

namespace ArchLucid.Retrieval.Pricing;

/// <summary>Resolves tenant EA discount from ambient scope and durable cost settings.</summary>
public sealed class ScopedAzureRetailPriceTenantCostSettingsContext(
    IScopeContextProvider scopeContextProvider,
    ITenantCostSettingsRepository tenantCostSettingsRepository) : IAzureRetailPriceTenantCostSettingsContext
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantCostSettingsRepository _tenantCostSettingsRepository =
        tenantCostSettingsRepository ?? throw new ArgumentNullException(nameof(tenantCostSettingsRepository));

    private Guid? _cachedTenantId;

    private decimal? _cachedEaDiscountMultiplier;

    public Guid TenantId => _cachedTenantId ??= _scopeContextProvider.GetCurrentScope().TenantId;

    public decimal EaDiscountMultiplier => _cachedEaDiscountMultiplier ??= ResolveEaDiscountMultiplier();

    private decimal ResolveEaDiscountMultiplier()
    {
        TenantCostSettingsRecord? settings = _tenantCostSettingsRepository
            .TryGetAsync(TenantId, CancellationToken.None)
            .GetAwaiter()
            .GetResult();

        return TenantEaDiscountMultiplierNormalizer.Normalize(settings?.EaDiscountMultiplier);
    }
}
