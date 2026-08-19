using ArchLucid.Core.Tenancy;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>In-memory / non-SQL hosts: per-tenant SQL catalog provisioning is not modeled; bind calls are ignored.</summary>
public sealed class NoOpTenantSqlCatalogProvisioner : ITenantSqlCatalogProvisioner
{
    /// <inheritdoc />
    public Task ProvisionTenantCatalogAsync(
        Guid tenantId,
        string sqlLogicalDatabaseName,
        CancellationToken cancellationToken)
    {
        _ = tenantId;
        _ = sqlLogicalDatabaseName;
        _ = cancellationToken;

        return Task.CompletedTask;
    }
}
