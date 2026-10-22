using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

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

    public Task<TenantBrandingProfileRecord?> TryGetDraftAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        inner.TryGetDraftAsync(tenantId, cancellationToken);

    public async Task ReplaceDraftAsync(TenantBrandingProfileRecord record, CancellationToken cancellationToken = default)
    {
        await inner.ReplaceDraftAsync(record, cancellationToken);
        cacheInvalidator.InvalidateTenantCache(record.TenantId);
    }

    public async Task UpdateStatusForTenantAsync(
        Guid tenantId,
        BrandingProfileStatus fromStatus,
        BrandingProfileStatus toStatus,
        string updatedBy,
        CancellationToken cancellationToken = default)
    {
        await inner.UpdateStatusForTenantAsync(tenantId, fromStatus, toStatus, updatedBy, cancellationToken);
        cacheInvalidator.InvalidateTenantCache(tenantId);
    }

    public Task<int> CountActiveProfilesAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        inner.CountActiveProfilesAsync(tenantId, cancellationToken);
}
