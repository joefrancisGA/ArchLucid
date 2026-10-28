using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Caching.Memory;

namespace ArchLucid.Application.InfraEvidence.Branding;

public sealed class TenantBrandingResolvedProfileCache(IMemoryCache memoryCache) : ITenantBrandingCacheInvalidator
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(10);
    // Fixed stripes prevent one semaphore per tenant from accumulating indefinitely.
    private readonly SemaphoreSlim[] loadGates = Enumerable.Range(0, 64)
        .Select(_ => new SemaphoreSlim(1, 1)).ToArray();

    // Each stripe protects its invalidation generation and cache writes atomically.
    // A collision can prevent one unrelated cache fill, but cannot expose another tenant.
    private readonly object[] generationLocks = Enumerable.Range(0, 64).Select(_ => new object()).ToArray();
    private readonly long[] generations = new long[64];

    private static int Stripe(Guid tenantId) => (int)((uint)tenantId.GetHashCode() % 64);

    public async Task<ResolvedTenantBrandingProfile> GetOrLoadAsync(
        Guid tenantId,
        Func<CancellationToken, Task<ResolvedTenantBrandingProfile>> load,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(load);
        if (TryGet(tenantId, out ResolvedTenantBrandingProfile? hit) && hit is not null)
            return hit;

        int stripe = Stripe(tenantId);
        SemaphoreSlim gate = loadGates[stripe];
        await gate.WaitAsync(cancellationToken);
        try
        {
            if (TryGet(tenantId, out hit) && hit is not null)
                return hit;

            long generation;
            lock (generationLocks[stripe])
                generation = generations[stripe];

            ResolvedTenantBrandingProfile resolved = await load(cancellationToken);
            lock (generationLocks[stripe])
            {
                // An invalidation during the fetch makes this response ineligible
                // for caching. The next caller must reload fresh data.
                if (generations[stripe] == generation)
                    memoryCache.Set(BuildCacheKey(tenantId), resolved, CacheDuration);
            }
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

        int stripe = Stripe(tenantId);
        lock (generationLocks[stripe])
            memoryCache.Set(BuildCacheKey(tenantId), profile, CacheDuration);
    }

    public void InvalidateTenantCache(Guid tenantId)
    {
        if (tenantId == Guid.Empty)
            return;

        int stripe = Stripe(tenantId);
        lock (generationLocks[stripe])
        {
            unchecked { generations[stripe]++; }
            memoryCache.Remove(BuildCacheKey(tenantId));
        }
    }

    private static string BuildCacheKey(Guid tenantId) => $"tenant-branding-resolved:{tenantId:D}";
}
