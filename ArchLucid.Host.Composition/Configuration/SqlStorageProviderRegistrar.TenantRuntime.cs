using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Sql;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class SqlStorageProviderRegistrar
{
    /// <summary>
    ///     Elevated tenant catalog connection for DDL bootstrap; mirrors DbUp bootstrap resolution in persistence startup.
    /// </summary>
    private static string ResolveTenantSchemaBootstrapConnectionString(
        SqlTopologyOptions topology,
        string runtimeConnectionString)
    {
        if (!string.IsNullOrWhiteSpace(topology.DevelopmentTenantBootstrapConnectionString))
            return topology.DevelopmentTenantBootstrapConnectionString;

        if (!string.IsNullOrWhiteSpace(topology.DevelopmentTenantConnectionString))
            return topology.DevelopmentTenantConnectionString;

        return runtimeConnectionString;
    }

    /// <summary>Tenant-plane SQL stack: routing, resilience, read replicas, bootstrapper.</summary>
    private static void RegisterTenantRuntimeInfrastructure(
        IServiceCollection services,
        string connectionString,
        string schemaBootstrapConnectionString,
        string scriptPath,
        bool enforceServerCertificateTrust)
    {
        SqlTenantRuntimeInfrastructureRegistrar.Register(
            services,
            connectionString,
            schemaBootstrapConnectionString,
            scriptPath,
            enforceServerCertificateTrust);
    }

    private static string ResolveArchLucidSqlScriptPath()
    {
        return PersistenceScriptPaths.ResolveTenantScriptPath();
    }
}
