namespace ArchLucid.Core.Tenancy;

public interface ITenantDatabaseBindingRepository
{
    Task<TenantDatabaseBindingRecord?> GetByTenantIdAsync(Guid tenantId, CancellationToken cancellationToken);

    Task<IReadOnlyList<TenantDatabaseBindingRecord>> ListBindingsWithStateAsync(
        TenantDatabaseProvisioningState state,
        CancellationToken cancellationToken);

    Task UpsertPendingAsync(
        Guid tenantId,
        string sqlLogicalDatabaseName,
        CancellationToken cancellationToken);

    Task MarkActiveAsync(Guid tenantId, CancellationToken cancellationToken);

    Task MarkFailedAsync(Guid tenantId, string errorMessage, CancellationToken cancellationToken);
}
