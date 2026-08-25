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
    ///     Maximum interval between audit-list scope revision bumps during append bursts (TB-2062). Keeps first-page
    ///     cache keys stable under pipeline write churn while the list TTL bounds staleness.
    /// </summary>
    internal const int AuditListInvalidationCoalesceSeconds = 3;

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

    /// <summary>
    ///     Bumps the tenant revision stamp read by custom-role list/assignment caches so prior entries are bypassed.
    /// </summary>
    public static Task InvalidateCustomRoleTenantAsync(IHotPathReadCache cache, Guid tenantId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);

        return BumpRevisionAsync(cache, HotPathCacheKeys.CustomRoleTenantRevision(tenantId), ct);
    }

    public static async Task RemoveScimUserAsync(
        IHotPathReadCache cache,
        Guid tenantId,
        Guid userId,
        string? externalId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);

        await cache.RemoveAsync(HotPathCacheKeys.ScimUserById(tenantId, userId), ct);

        if (!string.IsNullOrWhiteSpace(externalId))
            await cache.RemoveAsync(HotPathCacheKeys.ScimUserByExternalId(tenantId, externalId), ct);
    }

    public static Task RemoveTenantAsync(IHotPathReadCache cache, Guid tenantId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);

        return cache.RemoveAsync(HotPathCacheKeys.TenantById(tenantId), ct);
    }

    public static Task RemoveTenantSettingAsync(
        IHotPathReadCache cache,
        Guid tenantId,
        string settingKey,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);
        ArgumentException.ThrowIfNullOrWhiteSpace(settingKey);

        return cache.RemoveAsync(HotPathCacheKeys.TenantSetting(tenantId, settingKey), ct);
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

    public static Task RemoveTenantAiBudgetPolicyAsync(IHotPathReadCache cache, Guid tenantId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);

        return cache.RemoveAsync(HotPathCacheKeys.TenantAiBudgetPolicy(tenantId), ct);
    }

    public static Task RemoveTenantCostSettingsAsync(IHotPathReadCache cache, Guid tenantId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);

        return cache.RemoveAsync(HotPathCacheKeys.TenantCostSettings(tenantId), ct);
    }

    public static Task RemoveTenantIdentityProviderConfigurationAsync(
        IHotPathReadCache cache,
        Guid tenantId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);

        return cache.RemoveAsync(HotPathCacheKeys.TenantIdentityProviderConfiguration(tenantId), ct);
    }

    public static async Task InvalidateTenantSignInEmailDomainAsync(
        IHotPathReadCache cache,
        Guid tenantId,
        string? normalizedDomain,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(cache);

        await cache.RemoveAsync(HotPathCacheKeys.TenantSignInEmailDomainListByTenant(tenantId), ct);

        if (string.IsNullOrWhiteSpace(normalizedDomain))
            return;

        await cache.RemoveAsync(HotPathCacheKeys.TenantSignInEmailDomainByNormalized(normalizedDomain), ct);
        await cache.RemoveAsync(
            HotPathCacheKeys.TenantSignInEmailDomainByTenantAndNormalized(tenantId, normalizedDomain),
            ct);
    }

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
