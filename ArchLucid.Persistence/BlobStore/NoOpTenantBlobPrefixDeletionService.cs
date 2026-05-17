using ArchLucid.Core.Tenancy;

namespace ArchLucid.Persistence.BlobStore;

public sealed class NoOpTenantBlobPrefixDeletionService : ITenantBlobPrefixDeletionService
{
    public Task<TenantBlobPrefixDeletionResult> DeleteAllTenantPrefixesAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        _ = tenantId;
        _ = cancellationToken;

        return Task.FromResult(new TenantBlobPrefixDeletionResult());
    }
}
