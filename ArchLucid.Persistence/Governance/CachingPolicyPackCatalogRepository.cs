using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Caching;

namespace ArchLucid.Persistence.Governance;

/// <summary>Decorates <see cref="IPolicyPackCatalogRepository" /> for promoted catalog reads.</summary>
public sealed class CachingPolicyPackCatalogRepository(
    IPolicyPackCatalogRepository inner,
    IHotPathReadCache hotPathReadCache) : IPolicyPackCatalogRepository
{
    private const int CatalogAbsoluteExpirationSeconds = 300;

    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    private readonly IPolicyPackCatalogRepository _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public async Task<IReadOnlyList<PolicyPackCatalogListItem>> ListPromotedAsync(CancellationToken ct)
    {
        CachedPolicyPackCatalogList? cached = await _hotPathReadCache.GetOrCreateAsync(
            HotPathCacheKeys.PolicyPackCatalogPromotedList(),
            async innerCt =>
            {
                IReadOnlyList<PolicyPackCatalogListItem> rows = await _inner.ListPromotedAsync(innerCt);

                return new CachedPolicyPackCatalogList { Items = rows.ToList() };
            },
            ct,
            absoluteExpirationSecondsOverride: CatalogAbsoluteExpirationSeconds);

        return cached?.Items ?? [];
    }

    /// <inheritdoc />
    public Task<PolicyPackCatalogEntryDetail?> GetPromotedDetailByIdAsync(
        Guid policyPackCatalogEntryId,
        CancellationToken ct)
    {
        return _hotPathReadCache.GetOrCreateAsync(
            HotPathCacheKeys.PolicyPackCatalogPromotedDetail(policyPackCatalogEntryId),
            innerCt => _inner.GetPromotedDetailByIdAsync(policyPackCatalogEntryId, innerCt),
            ct,
            absoluteExpirationSecondsOverride: CatalogAbsoluteExpirationSeconds);
    }

    /// <inheritdoc />
    public async Task<bool> TryDemoteAsync(Guid policyPackCatalogEntryId, CancellationToken ct)
    {
        bool demoted = await _inner.TryDemoteAsync(policyPackCatalogEntryId, ct);

        if (demoted)
        {
            await HotPathCacheEviction.InvalidatePolicyPackCatalogAsync(_hotPathReadCache, ct);
            await HotPathCacheEviction.RemovePolicyPackCatalogDetailAsync(
                _hotPathReadCache,
                policyPackCatalogEntryId,
                ct);
        }

        return demoted;
    }

    /// <inheritdoc />
    public async Task<PolicyPackCatalogEntryDetail> UpsertPromotedFromSnapshotAsync(
        Guid sourcePolicyPackId,
        string displayName,
        string description,
        string packType,
        string snapshotVersion,
        string snapshotContentJson,
        CancellationToken ct)
    {
        PolicyPackCatalogEntryDetail detail = await _inner.UpsertPromotedFromSnapshotAsync(
            sourcePolicyPackId,
            displayName,
            description,
            packType,
            snapshotVersion,
            snapshotContentJson,
            ct);

        await HotPathCacheEviction.InvalidatePolicyPackCatalogAsync(_hotPathReadCache, ct);
        await HotPathCacheEviction.RemovePolicyPackCatalogDetailAsync(
            _hotPathReadCache,
            detail.PolicyPackCatalogEntryId,
            ct);

        return detail;
    }
}

/// <summary>Concrete list wrapper so HybridCache can round-trip catalog list items.</summary>
public sealed class CachedPolicyPackCatalogList
{
    public List<PolicyPackCatalogListItem> Items
    {
        get;
        init;
    } = [];
}
