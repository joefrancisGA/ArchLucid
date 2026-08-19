using Microsoft.Extensions.Caching.Memory;

namespace ArchLucid.Retrieval.Pricing;

/// <summary>
///     <see cref="IMemoryCache" /> decorator for <see cref="IAzureRetailPriceStructuredLookup" /> (24h per SKU + tenant EA
///     basis).
/// </summary>
public sealed class CachedAzureRetailPriceStructuredLookup(
    IAzureRetailPriceStructuredLookup inner,
    IMemoryCache memoryCache,
    IAzureRetailPriceTenantCostSettingsContext tenantCostSettingsContext,
    TimeProvider clock) : IAzureRetailPriceStructuredLookup
{
    internal static readonly TimeSpan CacheLifetime = TimeSpan.FromHours(24);

    private readonly IAzureRetailPriceStructuredLookup _inner =
        inner ?? throw new ArgumentNullException(nameof(inner));

    private readonly IMemoryCache _memoryCache =
        memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));

    private readonly IAzureRetailPriceTenantCostSettingsContext _tenantCostSettingsContext =
        tenantCostSettingsContext ?? throw new ArgumentNullException(nameof(tenantCostSettingsContext));

    private readonly TimeProvider _clock = clock ?? throw new ArgumentNullException(nameof(clock));

    /// <inheritdoc />
    public bool TryLookup(string serviceName, string region, string? sku, out AzureRetailPriceRow row)
    {
        string cacheKey = BuildCacheKey(serviceName, region, sku);

        if (_memoryCache.TryGetValue(cacheKey, out AzureRetailPriceRow? cached) && cached is not null)
        {
            row = cached;
            return true;
        }

        if (!_inner.TryLookup(serviceName, region, sku, out row))
            return false;

        MemoryCacheEntryOptions entryOptions = new()
        {
            AbsoluteExpiration = _clock.GetUtcNow().Add(CacheLifetime),
            Size = 1,
        };

        _memoryCache.Set(cacheKey, row, entryOptions);

        return true;
    }

    /// <inheritdoc />
    public string FormatForPrompt(AzureRetailPriceRow row) => _inner.FormatForPrompt(row);

    internal static string BuildCacheKey(
        Guid tenantId,
        decimal eaDiscountMultiplier,
        string serviceName,
        string region,
        string? sku) =>
        $"retail:{tenantId:D}:{eaDiscountMultiplier:0.####}:{serviceName}:{region}:{sku}".ToLowerInvariant();

    private string BuildCacheKey(string serviceName, string region, string? sku) =>
        BuildCacheKey(
            _tenantCostSettingsContext.TenantId,
            _tenantCostSettingsContext.EaDiscountMultiplier,
            serviceName,
            region,
            sku);
}
