namespace ArchLucid.Core.Tenancy;

/// <summary>
///     Migrates and binds a per-tenant SQL catalog after the control-plane tenant row exists (database-per-tenant topology).
/// </summary>
public interface ITenantSqlCatalogProvisioner
{
    Task ProvisionTenantCatalogAsync(
        Guid tenantId,
        string sqlLogicalDatabaseName,
        CancellationToken cancellationToken);
}
