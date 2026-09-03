using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Caching;

public static partial class HotPathCacheEviction
{
    /// <summary>Bumps alert-rule scope revision and removes the single-rule key when known.</summary>
    public static async Task InvalidateAlertRulesScopeAsync(
        IHotPathReadCache cache,
        ScopeContext scope,
        Guid? ruleId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);
        ArgumentNullException.ThrowIfNull(scope);

        await BumpRevisionAsync(cache, HotPathCacheKeys.AlertRuleListScopeRevision(scope), ct);

        if (ruleId is { } id)
            await cache.RemoveAsync(HotPathCacheKeys.AlertRuleById(id), ct);
    }

    /// <summary>Bumps composite alert-rule scope revision and removes the single-rule key when known.</summary>
    public static async Task InvalidateCompositeAlertRulesScopeAsync(
        IHotPathReadCache cache,
        ScopeContext scope,
        Guid? compositeRuleId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);
        ArgumentNullException.ThrowIfNull(scope);

        await BumpRevisionAsync(cache, HotPathCacheKeys.CompositeAlertRuleListScopeRevision(scope), ct);

        if (compositeRuleId is { } id)
            await cache.RemoveAsync(HotPathCacheKeys.CompositeAlertRuleById(id), ct);
    }
}
