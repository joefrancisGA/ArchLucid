using ArchLucid.Core.Tenancy;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>
///     Scoped cache so middleware and handlers in the same HTTP request do not repeat tenant SQL reads.
/// </summary>
public sealed class TenantGetByIdRequestCache(ITenantRepository inner) : ITenantGetByIdRequestCache
{
    private readonly Dictionary<Guid, TenantRecord?> _cache = new();
    private readonly ITenantRepository _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public async Task<TenantRecord?> GetByIdAsync(Guid tenantId, CancellationToken ct)
    {
        if (_cache.TryGetValue(tenantId, out TenantRecord? cached))
            return cached;

        TenantRecord? tenant = await _inner.GetByIdAsync(tenantId, ct).ConfigureAwait(false);
        _cache[tenantId] = tenant;

        return tenant;
    }
}
