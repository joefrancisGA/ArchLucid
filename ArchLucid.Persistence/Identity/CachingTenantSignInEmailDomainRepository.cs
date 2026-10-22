using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Caching;

namespace ArchLucid.Persistence.Identity;

/// <summary>Decorates <see cref="ITenantSignInEmailDomainRepository" /> for sign-in domain routing reads.</summary>
public sealed class CachingTenantSignInEmailDomainRepository(
    ITenantSignInEmailDomainRepository inner,
    IHotPathReadCache hotPathReadCache) : ITenantSignInEmailDomainRepository
{
    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    private readonly ITenantSignInEmailDomainRepository _inner =
        inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public Task<TenantSignInEmailDomainRecord?> FindByNormalizedDomainAsync(
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(normalizedDomain);

        return _hotPathReadCache.GetOrCreateAsync(
            HotPathCacheKeys.TenantSignInEmailDomainByNormalized(normalizedDomain),
            innerCt => _inner.FindByNormalizedDomainAsync(normalizedDomain, innerCt),
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<TenantSignInEmailDomainRecord>> ListByTenantIdAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        CachedTenantSignInEmailDomainList? cached = await _hotPathReadCache.GetOrCreateAsync(
            HotPathCacheKeys.TenantSignInEmailDomainListByTenant(tenantId),
            async innerCt =>
            {
                IReadOnlyList<TenantSignInEmailDomainRecord> rows =
                    await _inner.ListByTenantIdAsync(tenantId, innerCt);

                return new CachedTenantSignInEmailDomainList { Items = rows.ToList() };
            },
            cancellationToken);

        return cached?.Items ?? [];
    }

    /// <inheritdoc />
    public Task<TenantSignInEmailDomainRecord?> TryGetAsync(
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(normalizedDomain);

        return _hotPathReadCache.GetOrCreateAsync(
            HotPathCacheKeys.TenantSignInEmailDomainByTenantAndNormalized(tenantId, normalizedDomain),
            innerCt => _inner.TryGetAsync(tenantId, normalizedDomain, innerCt),
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task InsertAsync(TenantSignInEmailDomainRecord record, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);

        await _inner.InsertAsync(record, cancellationToken);
        await HotPathCacheEviction.InvalidateTenantSignInEmailDomainAsync(
            _hotPathReadCache,
            record.TenantId,
            record.NormalizedDomain,
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task UpdateAsync(TenantSignInEmailDomainRecord record, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);

        await _inner.UpdateAsync(record, cancellationToken);
        await HotPathCacheEviction.InvalidateTenantSignInEmailDomainAsync(
            _hotPathReadCache,
            record.TenantId,
            record.NormalizedDomain,
            cancellationToken);
    }
}

/// <summary>Concrete list wrapper so HybridCache can round-trip sign-in domain rows.</summary>
public sealed class CachedTenantSignInEmailDomainList
{
    public List<TenantSignInEmailDomainRecord> Items
    {
        get;
        init;
    } = [];
}
