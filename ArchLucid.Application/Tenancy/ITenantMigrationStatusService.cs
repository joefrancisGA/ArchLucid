namespace ArchLucid.Application.Tenancy;

public interface ITenantMigrationStatusService
{
    Task<TenantMigrationStatusSnapshot> GetForTenantAsync(Guid tenantId, CancellationToken cancellationToken);
}
