using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Sql;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class InMemoryStorageProviderRegistrar : IStorageProviderRegistrar
{
    public void Register(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<SqlTopologyOptions>(configuration.GetSection(SqlTopologyOptions.SectionPath));

        services.AddSingleton<ISystemSqlConnectionFactory, UnusedSystemSqlConnectionFactory>();
        services.AddSingleton<ITenantSqlConnectionFactory, UnusedTenantSqlConnectionFactory>();
        services.AddScoped<ITenantSqlCatalogProvisioner, NoOpTenantSqlCatalogProvisioner>();
        services.AddScoped<IWarmTenantCatalogStandbyRepository, NoOpWarmTenantCatalogStandbyRepository>();

        RegisterCoreSnapshots(services, configuration);
        RegisterIdentityAuth(services);
        RegisterGovernanceFindings(services);
        RegisterIntegrationsBilling(services, configuration);
        RegisterAdvisoryDraftOperations(services);
    }
}
