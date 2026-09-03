using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Caching;

public static partial class HotPathCacheEviction
{
    public static async Task RemovePolicyPackAsync(IHotPathReadCache cache, Guid policyPackId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);

        await cache.RemoveAsync(HotPathCacheKeys.PolicyPack(policyPackId), ct);
    }

    public static Task InvalidatePolicyPackResolverTenantAsync(
        IPolicyPackResolverCacheInvalidator invalidator,
        Guid tenantId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(invalidator);

        return invalidator.InvalidateTenantAsync(tenantId, ct);
    }

    /// <summary>
    ///     Bumps the scope revision stamp read by <see cref="Governance.CachingPolicyPackRepository" /> list cache
    ///     (TB-581).
    /// </summary>
    public static async Task InvalidatePolicyPackListScopeAsync(
        IHotPathReadCache cache,
        ScopeContext scope,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);
        ArgumentNullException.ThrowIfNull(scope);

        string revisionKey = HotPathCacheKeys.PolicyPackListScopeRevision(scope);

        await cache.RemoveAsync(revisionKey, ct);

        await cache.GetOrCreateAsync(
            revisionKey,
            _ => Task.FromResult<RunListScopeRevisionState?>(
                new RunListScopeRevisionState { Revision = TimeProvider.System.GetUtcNow().Ticks }),
            ct);
    }

    public static async Task RemovePolicyPackVersionAsync(
        IHotPathReadCache cache,
        Guid policyPackId,
        string? version,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);

        await cache.RemoveAsync(HotPathCacheKeys.PolicyPackVersionList(policyPackId), ct);

        if (!string.IsNullOrWhiteSpace(version))
            await cache.RemoveAsync(HotPathCacheKeys.PolicyPackVersion(policyPackId, version), ct);
    }

    public static async Task InvalidatePolicyPackCatalogAsync(IHotPathReadCache cache, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);

        await cache.RemoveAsync(HotPathCacheKeys.PolicyPackCatalogPromotedList(), ct);
    }

    public static Task RemovePolicyPackCatalogDetailAsync(
        IHotPathReadCache cache,
        Guid policyPackCatalogEntryId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);

        return cache.RemoveAsync(HotPathCacheKeys.PolicyPackCatalogPromotedDetail(policyPackCatalogEntryId), ct);
    }
}
