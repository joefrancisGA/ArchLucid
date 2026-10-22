using Polly;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Caching.Memory;

namespace ArchLucid.Host.Composition.Configuration;

/// <summary>
///     Control-plane SQL: system catalog factory, tenant database bindings, resolver, and catalog provisioning.
/// </summary>
internal static class SqlSystemRuntimeInfrastructureRegistrar
{
    public static void Register(
        IServiceCollection services,
        string connectionString,
        string effectiveSystemConnectionString,
        bool enforceServerCertificateTrust)
    {
        services.AddSingleton<ISystemSqlConnectionFactory>(sp =>
        {
            SqlOpenResilienceOptions sqlOpenOpts = sp.GetRequiredService<IOptions<SqlOpenResilienceOptions>>().Value;
            ResiliencePipeline pipeline = SqlOpenResilienceDefaults.BuildSqlOpenRetryPipeline(
                sp.GetRequiredService<ILogger<DedicatedSystemSqlConnectionFactory>>(),
                sqlOpenOpts.MaxRetryAttempts,
                TimeSpan.FromMilliseconds(sqlOpenOpts.BaseDelayMilliseconds));

            return new DedicatedSystemSqlConnectionFactory(
                effectiveSystemConnectionString,
                pipeline,
                enforceServerCertificateTrust);
        });

        services.AddScoped<ITenantDatabaseBindingRepository, DapperTenantDatabaseBindingRepository>();
        services.AddScoped<ITenantCatalogMigrationRepository, DapperTenantCatalogMigrationRepository>();
        services.AddScoped<IWarmTenantCatalogStandbyRepository, DapperWarmTenantCatalogStandbyRepository>();
        services.AddScoped<IWarmTenantCatalogReplenishService, WarmTenantCatalogReplenishService>();
        services.AddScoped<ITenantDatabaseResolver>(sp =>
            new TenantDatabaseResolver(
                sp.GetRequiredService<ITenantDatabaseBindingRepository>(),
                sp.GetRequiredService<IMemoryCache>(),
                sp.GetRequiredService<IOptionsMonitor<SqlTopologyOptions>>(),
                sp.GetRequiredService<IOptionsMonitor<ArchLucidPersistenceOptions>>(),
                connectionString,
                enforceServerCertificateTrust));

        services.AddScoped<ITenantSqlCatalogProvisioner, SqlTenantSqlCatalogProvisioner>();
    }
}
