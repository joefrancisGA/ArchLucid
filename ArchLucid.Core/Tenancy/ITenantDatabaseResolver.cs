namespace ArchLucid.Core.Tenancy;

/// <summary>Resolves the SQL connection string for a tenant catalog in <see cref="SqlTopologyMode.SystemWithPerTenantCatalogs" />.</summary>
public interface ITenantDatabaseResolver
{
    Task<string> ResolveTenantConnectionStringAsync(Guid tenantId, CancellationToken cancellationToken);

    void InvalidateCachedTenantConnectionString(Guid tenantId);
}
