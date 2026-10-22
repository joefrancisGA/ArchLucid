namespace ArchLucid.Persistence.Caching;

public static partial class HotPathCacheEviction
{
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
}
