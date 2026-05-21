namespace ArchLucid.Core.Tenancy;

/// <summary>Resolves the SQL connection string for a tenant catalog in <see cref="SqlTopologyMode.SystemWithPerTenantCatalogs" />.</summary>
public interface ITenantDatabaseResolver
{
    Task<string> ResolveTenantConnectionStringAsync(Guid tenantId, CancellationToken cancellationToken);

    /// <summary>
    ///     Resolves the tenant read-scale-out connection string when
    ///     <c>ArchLucid:Persistence:ReadOnlyConnectionStringTemplate</c> is configured; otherwise returns <c>null</c>.
    /// </summary>
    Task<string?> TryResolveReadOnlyConnectionStringAsync(Guid tenantId, CancellationToken cancellationToken);

    void InvalidateCachedTenantConnectionString(Guid tenantId);
}
