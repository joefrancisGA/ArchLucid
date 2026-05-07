using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Caching;

/// <summary>Removes hot-path keys after writes.</summary>
public static class HotPathCacheEviction
{
    public static async Task RemoveManifestAsync(
        IHotPathReadCache cache,
        ScopeContext scope,
        Guid manifestId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);
        ArgumentNullException.ThrowIfNull(scope);

        await cache.RemoveAsync(HotPathCacheKeys.Manifest(scope, manifestId), ct);
    }

    public static async Task RemoveRunAsync(IHotPathReadCache cache, ScopeContext scope, Guid runId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);
        ArgumentNullException.ThrowIfNull(scope);

        await cache.RemoveAsync(HotPathCacheKeys.Run(scope, runId), ct);
    }

    public static async Task RemovePolicyPackAsync(IHotPathReadCache cache, Guid policyPackId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);

        await cache.RemoveAsync(HotPathCacheKeys.PolicyPack(policyPackId), ct);
    }
}
