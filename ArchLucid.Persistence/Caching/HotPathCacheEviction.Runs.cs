using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Caching;

public static partial class HotPathCacheEviction
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

    /// <summary>
    ///     Bumps the scope revision stamp read by <see cref="Repositories.CachingRunRepository" /> so prior run list
    ///     cache entries are bypassed without enumerating take/project key variants (TB-578).
    /// </summary>
    public static async Task InvalidateRunListScopeAsync(
        IHotPathReadCache cache,
        ScopeContext scope,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);
        ArgumentNullException.ThrowIfNull(scope);

        string revisionKey = HotPathCacheKeys.RunListScopeRevision(scope);

        await cache.RemoveAsync(revisionKey, ct);

        await cache.GetOrCreateAsync(
            revisionKey,
            _ => Task.FromResult<RunListScopeRevisionState?>(
                new RunListScopeRevisionState { Revision = TimeProvider.System.GetUtcNow().Ticks }),
            ct);
    }

    /// <summary>
    ///     Bumps the scope revision stamp read by <see cref="Audit.CachingAuditRepository" /> so prior audit list cache
    ///     entries are bypassed without enumerating filter/take variants (TB-581). Bursts coalesce within
    ///     <see cref="AuditListInvalidationCoalesceSeconds" /> (TB-2062).
    /// </summary>
    public static async Task InvalidateAuditListScopeAsync(
        IHotPathReadCache cache,
        ScopeContext scope,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);
        ArgumentNullException.ThrowIfNull(scope);

        string revisionKey = HotPathCacheKeys.AuditListScopeRevision(scope);

        RunListScopeRevisionState? current = await cache.GetOrCreateAsync(
            revisionKey,
            _ => Task.FromResult<RunListScopeRevisionState?>(new RunListScopeRevisionState { Revision = 0 }),
            ct);

        long nowTicks = TimeProvider.System.GetUtcNow().Ticks;
        long lastRevision = current?.Revision ?? 0;
        long coalesceTicks = TimeSpan.FromSeconds(AuditListInvalidationCoalesceSeconds).Ticks;

        if (lastRevision > 0 && nowTicks - lastRevision < coalesceTicks)
            return;

        await cache.RemoveAsync(revisionKey, ct);

        await cache.GetOrCreateAsync(
            revisionKey,
            _ => Task.FromResult<RunListScopeRevisionState?>(
                new RunListScopeRevisionState { Revision = nowTicks }),
            ct);
    }

    public static Task RemoveFindingsSnapshotAsync(
        IHotPathReadCache cache,
        ScopeContext scope,
        Guid findingsSnapshotId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);
        ArgumentNullException.ThrowIfNull(scope);

        return cache.RemoveAsync(HotPathCacheKeys.FindingsSnapshot(scope, findingsSnapshotId), ct);
    }

    public static Task RemoveDraftRequestAsync(
        IHotPathReadCache cache,
        ScopeContext scope,
        Guid draftId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);
        ArgumentNullException.ThrowIfNull(scope);

        return cache.RemoveAsync(HotPathCacheKeys.DraftRequest(scope, draftId), ct);
    }
}
