using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Caching;

namespace ArchLucid.Persistence.Identity;

/// <summary>Decorates <see cref="ITenantIdentityProviderConfigurationRepository" /> for SSO routing reads.</summary>
public sealed class CachingTenantIdentityProviderConfigurationRepository(
    ITenantIdentityProviderConfigurationRepository inner,
    IHotPathReadCache hotPathReadCache) : ITenantIdentityProviderConfigurationRepository
{
    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    private readonly ITenantIdentityProviderConfigurationRepository _inner =
        inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public Task<TenantIdentityProviderConfigurationRecord?> TryGetAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        return _hotPathReadCache.GetOrCreateAsync(
            HotPathCacheKeys.TenantIdentityProviderConfiguration(tenantId),
            innerCt => _inner.TryGetAsync(tenantId, innerCt),
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task UpsertAsync(
        TenantIdentityProviderConfigurationRecord record,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);

        await _inner.UpsertAsync(record, cancellationToken);
        await HotPathCacheEviction.RemoveTenantIdentityProviderConfigurationAsync(
            _hotPathReadCache,
            record.TenantId,
            cancellationToken);
    }
}
