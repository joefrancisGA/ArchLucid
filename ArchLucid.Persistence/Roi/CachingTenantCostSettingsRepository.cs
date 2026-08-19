using ArchLucid.Persistence.Caching;

namespace ArchLucid.Persistence.Roi;

/// <summary>Decorates <see cref="ITenantCostSettingsRepository" /> for ROI / savings calculation reads.</summary>
public sealed class CachingTenantCostSettingsRepository(
    ITenantCostSettingsRepository inner,
    IHotPathReadCache hotPathReadCache) : ITenantCostSettingsRepository
{
    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    private readonly ITenantCostSettingsRepository _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public Task<TenantCostSettingsRecord?> TryGetAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        return _hotPathReadCache.GetOrCreateAsync(
            HotPathCacheKeys.TenantCostSettings(tenantId),
            innerCt => _inner.TryGetAsync(tenantId, innerCt),
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task UpsertAsync(TenantCostSettingsRecord record, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);

        await _inner.UpsertAsync(record, cancellationToken);
        await HotPathCacheEviction.RemoveTenantCostSettingsAsync(
            _hotPathReadCache,
            record.TenantId,
            cancellationToken);
    }
}
