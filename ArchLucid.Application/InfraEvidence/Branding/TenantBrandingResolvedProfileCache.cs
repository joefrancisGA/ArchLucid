using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Caching.Memory;

namespace ArchLucid.Application.InfraEvidence.Branding;

public sealed class TenantBrandingResolvedProfileCache(IMemoryCache memoryCache) : ITenantBrandingCacheInvalidator
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(10);

    public bool TryGet(Guid tenantId, out ResolvedTenantBrandingProfile? profile)
    {
        if (tenantId == Guid.Empty)
        {
            profile = null;
            return false;
        }

        if (memoryCache.TryGetValue(BuildCacheKey(tenantId), out ResolvedTenantBrandingProfile? cached))
        {
            profile = cached;
            return cached is not null;
        }

        profile = null;
        return false;
    }

    public void Set(Guid tenantId, ResolvedTenantBrandingProfile profile)
    {
        if (tenantId == Guid.Empty)
            return;

        memoryCache.Set(BuildCacheKey(tenantId), profile, CacheDuration);
    }

    public void InvalidateTenantCache(Guid tenantId)
    {
        if (tenantId == Guid.Empty)
            return;

        memoryCache.Remove(BuildCacheKey(tenantId));
    }

    private static string BuildCacheKey(Guid tenantId) => $"tenant-branding-resolved:{tenantId:D}";
}
