namespace ArchLucid.Core.AzureExtractor;

public interface ITenantCloudConnectionRepository
{
    Task<TenantCloudConnectionRecord?> TryGetAsync(Guid connectionId, CancellationToken cancellationToken);
    
    Task<IReadOnlyList<TenantCloudConnectionRecord>> ListByTenantAsync(Guid tenantId, CancellationToken cancellationToken);

    Task UpsertAsync(TenantCloudConnectionRecord record, CancellationToken cancellationToken);
}
