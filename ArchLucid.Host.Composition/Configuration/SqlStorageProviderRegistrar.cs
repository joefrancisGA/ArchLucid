using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Sql;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class SqlStorageProviderRegistrar : IStorageProviderRegistrar
{
    public void Register(IServiceCollection services, IConfiguration configuration)
    {
        DapperGlobalCommandTimeoutBootstrap.ApplyIfConfigured(configuration);

        StructuralExecutionModeTypeHandler.Register();

        bool enforceServerCertificateTrust =
            ArchLucidConfigurationBridge.ShouldEnforceSqlServerCertificateTrust(configuration);

        services.Configure<WarmTenantCatalogOptions>(configuration.GetSection(WarmTenantCatalogOptions.SectionPath));
        services.Configure<SqlConnectionPoolOptions>(configuration.GetSection(SqlConnectionPoolOptions.SectionPath));

        SqlConnectionPoolOptions poolSnapshot =
            configuration.GetSection(SqlConnectionPoolOptions.SectionPath).Get<SqlConnectionPoolOptions>()
            ?? new SqlConnectionPoolOptions();

        string connectionString = SqlConnectionStringPoolNormalizer.Apply(
            ArchLucidConfigurationBridge.ResolveSqlConnectionString(
                                      configuration,
                                      enforceServerCertificateTrust)
                                  ?? throw new InvalidOperationException(
                                      "ConnectionStrings:ArchLucid is missing or blank. "
                                      + "Set ConnectionStrings:ArchLucid in appsettings or the ConnectionStrings__ArchLucid "
                                      + "environment variable to a valid SQL Server connection string before starting the host "
                                      + "(not required when ArchLucid:StorageProvider is InMemory)."),
            poolSnapshot);

        services.Configure<SqlServerOptions>(configuration.GetSection(SqlServerOptions.SectionName));
        services.Configure<SqlTopologyOptions>(configuration.GetSection(SqlTopologyOptions.SectionPath));

        ArchLucidStorageServiceCollectionExtensions.RegisterArtifactLargePayloadBlobStore(services, configuration);
        ArchLucidStorageServiceCollectionExtensions.RegisterHotPathReadCaching(services, configuration);
        ArchLucidStorageServiceCollectionExtensions.RegisterSharedDistributedCacheAndLlmCompletion(services, configuration);

        services.TryAddSingleton<IMemoryCache>(_ => new MemoryCache(new MemoryCacheOptions()));

        string? systemConnectionString = ArchLucidConfigurationBridge.ResolveSqlSystemConnectionString(
            configuration,
            enforceServerCertificateTrust);
        SqlTopologyOptions topologySnapshot =
            configuration.GetSection(SqlTopologyOptions.SectionPath).Get<SqlTopologyOptions>() ?? new SqlTopologyOptions();
        string effectiveSystemConnectionString = topologySnapshot.Mode == SqlTopologyMode.SystemWithPerTenantCatalogs
            ? (systemConnectionString ?? throw new InvalidOperationException(
                "ConnectionStrings:ArchLucidSystem is required when ArchLucid:SqlTopology:Mode is SystemWithPerTenantCatalogs."))
            : connectionString;

        RegisterSystemRuntimeInfrastructure(
            services,
            connectionString,
            effectiveSystemConnectionString,
            enforceServerCertificateTrust);

        string scriptPath = ResolveArchLucidSqlScriptPath();

        string schemaBootstrapConnectionString = ResolveTenantSchemaBootstrapConnectionString(
            topologySnapshot,
            connectionString);

        RegisterTenantRuntimeInfrastructure(
            services,
            connectionString,
            schemaBootstrapConnectionString,
            scriptPath,
            enforceServerCertificateTrust);
        RegisterTenantRepositories(services, configuration);

        RegisterAdvisoryDraftOperations(services);

        RegisterSqlOperationalSingletons(services, configuration, connectionString);
    }
}
