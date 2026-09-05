using System.Collections.Concurrent;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>In-memory tenant branding profile store for tests and in-memory hosts.</summary>
public sealed class InMemoryTenantBrandingProfileRepository : ITenantBrandingProfileRepository
{
    private readonly ConcurrentDictionary<Guid, List<TenantBrandingProfileRecord>> _profilesByTenant = new();

    public Task InsertAsync(TenantBrandingProfileRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        if (record.BrandingStatus == BrandingProfileStatus.Active)
        {
            int activeCount = _profilesByTenant.GetOrAdd(record.TenantId, _ => []).Count(
                p => p.BrandingStatus == BrandingProfileStatus.Active);

            if (activeCount > 0)
                throw new InvalidOperationException("Only one Active branding profile is allowed per tenant.");
        }

        _profilesByTenant.AddOrUpdate(
            record.TenantId,
            _ => [record],
            (_, list) =>
            {
                list.Add(record);
                return list;
            });

        return Task.CompletedTask;
    }

    public Task<TenantBrandingProfileRecord?> TryGetActiveAsync(Guid tenantId, CancellationToken cancellationToken = default)
        => TryGetByStatusAsync(tenantId, BrandingProfileStatus.Active);

    public Task<TenantBrandingProfileRecord?> TryGetDefaultAsync(Guid tenantId, CancellationToken cancellationToken = default)
        => TryGetByStatusAsync(tenantId, BrandingProfileStatus.Default);

    public Task<int> CountActiveProfilesAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        if (!_profilesByTenant.TryGetValue(tenantId, out List<TenantBrandingProfileRecord>? profiles))
            return Task.FromResult(0);

        int count = profiles.Count(p => p.BrandingStatus == BrandingProfileStatus.Active);
        return Task.FromResult(count);
    }

    private Task<TenantBrandingProfileRecord?> TryGetByStatusAsync(Guid tenantId, BrandingProfileStatus status)
    {
        if (!_profilesByTenant.TryGetValue(tenantId, out List<TenantBrandingProfileRecord>? profiles))
            return Task.FromResult<TenantBrandingProfileRecord?>(null);

        TenantBrandingProfileRecord? match = profiles
            .Where(p => p.BrandingStatus == status)
            .OrderByDescending(p => p.Version)
            .FirstOrDefault();

        return Task.FromResult(match);
    }
}
