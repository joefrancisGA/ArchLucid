using System.Collections.Concurrent;

using ArchLucid.Core.Tenancy;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>
///     Scoped cache so middleware and handlers in the same HTTP request do not repeat tenant SQL reads.
/// </summary>
public sealed class TenantGetByIdRequestCache(ITenantRepository inner) : ITenantGetByIdRequestCache
{
    // A wrapper is required because a tenant-not-found result (null) is cacheable.
    private sealed record CacheEntry(TenantRecord? Tenant);

    private readonly ConcurrentDictionary<Guid, CacheEntry> _cache = new();
    private readonly ConcurrentDictionary<Guid, SemaphoreSlim> _loadGates = new();
    private readonly ITenantRepository _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public async Task<TenantRecord?> GetByIdAsync(Guid tenantId, CancellationToken ct)
    {
        if (_cache.TryGetValue(tenantId, out CacheEntry? cached))
            return cached.Tenant;

        // A single per-tenant gate coalesces parallel misses without serializing
        // unrelated tenant lookups. The gate lasts only as long as this scoped cache.
        SemaphoreSlim gate = _loadGates.GetOrAdd(tenantId, static _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            if (_cache.TryGetValue(tenantId, out cached))
                return cached.Tenant;

            // The leader's request token is honored; a failed or canceled read is
            // never cached, and the next waiter can retry with its own token.
            TenantRecord? tenant = await _inner.GetByIdAsync(tenantId, ct).ConfigureAwait(false);
            _cache[tenantId] = new CacheEntry(tenant);
            return tenant;
        }
        finally
        {
            gate.Release();
        }
    }
}
