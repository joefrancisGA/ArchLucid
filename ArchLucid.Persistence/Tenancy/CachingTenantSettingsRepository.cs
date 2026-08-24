using System.Collections.Concurrent;

using ArchLucid.Persistence.Caching;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>Decorates <see cref="ITenantSettingsRepository" /> with per-key read-through cache.</summary>
public sealed class CachingTenantSettingsRepository(
    ITenantSettingsRepository inner,
    IHotPathReadCache hotPathReadCache) : ITenantSettingsRepository
{
    private static readonly ConcurrentDictionary<(Guid TenantId, string SettingKey), long> CacheGenerations =
        new();

    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    private readonly ITenantSettingsRepository _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public async Task<string?> TryGetAsync(Guid tenantId, string settingKey, CancellationToken cancellationToken)
    {
        string normalizedKey = TenantSettingKeyNormalizer.Normalize(settingKey);

        // Wrapper distinguishes "cached miss" (null Value) from HybridCache absent entry.
        TenantSettingCacheEntry? entry = await _hotPathReadCache.GetOrCreateAsync(
            BuildCacheKey(tenantId, normalizedKey),
            async innerCt =>
            {
                string? value = await _inner.TryGetAsync(tenantId, normalizedKey, innerCt);

                return new TenantSettingCacheEntry { Value = value, IsPresent = value is not null };
            },
            cancellationToken);

        if (entry is null || !entry.IsPresent)
            return null;

        return entry.Value;
    }

    /// <inheritdoc />
    public async Task UpsertAsync(
        Guid tenantId,
        string settingKey,
        string settingValue,
        CancellationToken cancellationToken)
    {
        string normalizedKey = TenantSettingKeyNormalizer.Normalize(settingKey);

        await _inner.UpsertAsync(tenantId, normalizedKey, settingValue, cancellationToken);
        BumpCacheGeneration(tenantId, normalizedKey);
    }

    /// <inheritdoc />
    public async Task DeleteAsync(Guid tenantId, string settingKey, CancellationToken cancellationToken)
    {
        string normalizedKey = TenantSettingKeyNormalizer.Normalize(settingKey);

        await _inner.DeleteAsync(tenantId, normalizedKey, cancellationToken);
        BumpCacheGeneration(tenantId, normalizedKey);
    }

    private static string BuildCacheKey(Guid tenantId, string normalizedKey)
    {
        long generation = CacheGenerations.GetValueOrDefault((tenantId, normalizedKey));

        return $"{HotPathCacheKeys.TenantSetting(tenantId, normalizedKey)}:g{generation}";
    }

    private static void BumpCacheGeneration(Guid tenantId, string normalizedKey) =>
        CacheGenerations.AddOrUpdate((tenantId, normalizedKey), 1, static (_, current) => current + 1);
}

/// <summary>Cache slot for nullable setting values (null means key absent in SQL).</summary>
public sealed class TenantSettingCacheEntry
{
    public string? Value
    {
        get;
        init;
    }

    public bool IsPresent
    {
        get;
        init;
    }
}
