using System.Collections.Concurrent;
using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using JetBrains.Annotations;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class InMemoryTenantRepository
{

    public Task<TenantRecord?> GetByIdAsync(Guid tenantId, CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            return Task.FromResult(_byId.GetValueOrDefault(tenantId));
        }
    }


    public Task<TenantRecord?> GetByIdFromControlPlaneCatalogAsync(Guid tenantId, CancellationToken ct)
    {
        return GetByIdAsync(tenantId, ct);
    }


    public Task<TenantRecord?> GetBySlugFromControlPlaneCatalogAsync(string slug, CancellationToken ct)
    {
        return GetBySlugAsync(slug, ct);
    }


    public Task<TenantRecord?> GetByNormalizedOrganizationNameAsync(string normalizedOrganizationName, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(normalizedOrganizationName);
        _ = ct;

        string key = normalizedOrganizationName.Trim().ToUpperInvariant();

        lock (_trialGate)
        {
            TenantRecord? match = _byId.Values.FirstOrDefault(
                record => string.Equals(record.Name.Trim().ToUpperInvariant(), key, StringComparison.Ordinal));

            return Task.FromResult(match);
        }
    }


    public Task<TenantRecord?> GetBySlugAsync(string slug, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(slug);
        _ = ct;

        string key = slug.Trim().ToLowerInvariant();

        return !_slugToId.TryGetValue(key, out Guid id) ? Task.FromResult<TenantRecord?>(null) : GetByIdAsync(id, ct);
    }


    public Task<TenantRecord?> GetByEntraTenantIdAsync(Guid entraTenantId, CancellationToken ct)
    {
        _ = ct;

        return !_entraTenantIdToTenantId.TryGetValue(entraTenantId, out Guid tenantId) ? Task.FromResult<TenantRecord?>(null) : GetByIdAsync(tenantId, ct);
    }


    public Task<IReadOnlyList<TenantRecord>> ListAsync(CancellationToken ct)
    {
        _ = ct;

        IReadOnlyList<TenantRecord> list;

        lock (_trialGate)
        {
            list = _byId.Values.OrderByDescending(static r => r.CreatedUtc).ToList();
        }

        return Task.FromResult(list);
    }
}
