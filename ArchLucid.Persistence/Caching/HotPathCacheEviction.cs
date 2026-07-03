using ArchLucid.Core.Governance.PolicyPacks;
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
    ///     Bumps the scope revision stamp read by <see cref="Audit.CachingAuditRepository" /> so prior audit list cache
    ///     entries are bypassed without enumerating filter/take variants (TB-581).
    /// </summary>
    public static async Task InvalidateAuditListScopeAsync(
        IHotPathReadCache cache,
        ScopeContext scope,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);
        ArgumentNullException.ThrowIfNull(scope);

        string revisionKey = HotPathCacheKeys.AuditListScopeRevision(scope);

        await cache.RemoveAsync(revisionKey, ct);

        await cache.GetOrCreateAsync(
            revisionKey,
            _ => Task.FromResult<RunListScopeRevisionState?>(
                new RunListScopeRevisionState { Revision = TimeProvider.System.GetUtcNow().Ticks }),
            ct);
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
}
