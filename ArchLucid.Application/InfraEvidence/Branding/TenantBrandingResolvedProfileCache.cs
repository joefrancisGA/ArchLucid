using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Caching.Memory;

namespace ArchLucid.Application.InfraEvidence.Branding;

public sealed class TenantBrandingResolvedProfileCache(IMemoryCache memoryCache) : ITenantBrandingCacheInvalidator
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(10);
    // Fixed stripes prevent one semaphore per tenant from accumulating indefinitely.
    private readonly SemaphoreSlim[] loadGates = Enumerable.Range(0, 64)
        .Select(_ => new SemaphoreSlim(1, 1)).ToArray();

    public async Task<ResolvedTenantBrandingProfile> GetOrLoadAsync(
        Guid tenantId,
        Func<CancellationToken, Task<ResolvedTenantBrandingProfile>> load,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(load);
        if (TryGet(tenantId, out ResolvedTenantBrandingProfile? hit) && hit is not null)
            return hit;

        SemaphoreSlim gate = loadGates[(int)((uint)tenantId.GetHashCode() % (uint)loadGates.Length)];
        await gate.WaitAsync(cancellationToken);
        try
        {
            if (TryGet(tenantId, out hit) && hit is not null)
                return hit;

            ResolvedTenantBrandingProfile resolved = await load(cancellationToken);
            Set(tenantId, resolved);
            return resolved;
        }
        finally
        {
            gate.Release();
        }
    }

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
