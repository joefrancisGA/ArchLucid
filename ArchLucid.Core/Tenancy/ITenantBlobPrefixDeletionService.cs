namespace ArchLucid.Core.Tenancy;

/// <summary>Removes tenant-prefixed blobs across well-known containers (shared account, prefix isolation).</summary>
public interface ITenantBlobPrefixDeletionService
{
    Task<TenantBlobPrefixDeletionResult> DeleteAllTenantPrefixesAsync(Guid tenantId, CancellationToken cancellationToken);
}
