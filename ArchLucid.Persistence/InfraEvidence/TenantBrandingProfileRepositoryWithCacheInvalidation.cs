namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>Invalidates tenant branding cache after profile mutations.</summary>
public sealed class TenantBrandingProfileRepositoryWithCacheInvalidation(
    ITenantBrandingProfileRepository inner,
    ITenantBrandingCacheInvalidator cacheInvalidator) : ITenantBrandingProfileRepository
{
    public async Task InsertAsync(TenantBrandingProfileRecord record, CancellationToken cancellationToken = default)
    {
        await inner.InsertAsync(record, cancellationToken);
        cacheInvalidator.InvalidateTenantCache(record.TenantId);
    }

    public Task<TenantBrandingProfileRecord?> TryGetActiveAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        inner.TryGetActiveAsync(tenantId, cancellationToken);

    public Task<TenantBrandingProfileRecord?> TryGetDefaultAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        inner.TryGetDefaultAsync(tenantId, cancellationToken);

    public Task<int> CountActiveProfilesAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        inner.CountActiveProfilesAsync(tenantId, cancellationToken);
}
