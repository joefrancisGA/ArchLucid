using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Caching;

/// <summary>Removes hot-path keys after writes.</summary>
public static partial class HotPathCacheEviction
{
    /// <summary>
    ///     Maximum interval between audit-list scope revision bumps during append bursts (TB-2062). Keeps first-page
    ///     cache keys stable under pipeline write churn while the list TTL bounds staleness.
    /// </summary>
    internal const int AuditListInvalidationCoalesceSeconds = 3;

    private static async Task BumpRevisionAsync(IHotPathReadCache cache, string revisionKey, CancellationToken ct)
    {
        await cache.RemoveAsync(revisionKey, ct);

        await cache.GetOrCreateAsync(
            revisionKey,
            _ => Task.FromResult<RunListScopeRevisionState?>(
                new RunListScopeRevisionState { Revision = TimeProvider.System.GetUtcNow().Ticks }),
            ct);
    }
}
