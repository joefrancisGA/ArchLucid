using Microsoft.Extensions.Caching.Memory;

namespace ArchLucid.Application.Tenancy;

/// <summary>
///     Process-local negative cache for tenants that are not on a metered active trial (TB-574).
/// </summary>
public sealed class TenantTrialSeatSkipCache(IMemoryCache memoryCache) : ITenantTrialSeatSkipCache
{
    /// <summary>How long a non-trial tenant skips seat-claim SQL after the first plain tenant read.</summary>
    internal static readonly TimeSpan SkipDuration = TimeSpan.FromMinutes(5);

    private readonly IMemoryCache _memoryCache = memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));

    /// <inheritdoc />
    public bool IsSeatClaimNotRequired(Guid tenantId)
    {
        if (tenantId == Guid.Empty)
            return false;

        return _memoryCache.TryGetValue(BuildCacheKey(tenantId), out _);
    }

    /// <inheritdoc />
    public void RememberSeatClaimNotRequired(Guid tenantId)
    {
        if (tenantId == Guid.Empty)
            return;

        _memoryCache.Set(BuildCacheKey(tenantId), true, SkipDuration);
    }

    private static string BuildCacheKey(Guid tenantId) => $"trial-seat-skip:{tenantId:D}";
}
