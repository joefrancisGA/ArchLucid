using Polly;

using ArchLucid.Core.Analytics;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Analytics;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Sql;
using ArchLucid.Persistence.WeeklyDigest;

namespace ArchLucid.Host.Composition.Configuration;

/// <summary>
///     Tenant-plane SQL stack: routing, resilience, read replicas, and schema bootstrapper.
/// </summary>
internal static class SqlTenantRuntimeInfrastructureRegistrar
{
    public static void Register(
        IServiceCollection services,
        string connectionString,
        string schemaBootstrapConnectionString,
        string scriptPath,
        bool enforceServerCertificateTrust)
    {
        services.AddSingleton<SqlConnectionFactory>(
            _ => new SqlConnectionFactory(connectionString, enforceServerCertificateTrust));

        RegisterBackgroundWorkerSqlResilience(services);

        services.AddScoped<IWeeklyArchitectureCriticalFindingSummaryRepository,
            DapperWeeklyArchitectureCriticalFindingSummaryRepository>();

        services.AddScoped<ScopedRoutingSqlConnectionFactory>(sp =>
            new ScopedRoutingSqlConnectionFactory(
                connectionString,
                sp.GetRequiredService<ISystemSqlConnectionFactory>(),
                sp.GetRequiredService<ITenantDatabaseResolver>(),
                sp.GetRequiredService<IScopeContextProvider>(),
                sp.GetRequiredService<IOptionsMonitor<SqlTopologyOptions>>(),
                enforceServerCertificateTrust));

        services.AddScoped<IInternalCrossTenantMetricsCollector, SqlInternalCrossTenantMetricsCollector>();
        services.AddScoped<IInternalCrossTenantRollupRepository, SqlInternalCrossTenantRollupRepository>();
        services.AddScoped<InternalCrossTenantRollupProcessor>();
        services.AddScoped<IInternalCrossTenantAnalyticsService, SqlInternalCrossTenantAnalyticsService>();

        services.AddScoped<ResilientSqlConnectionFactory>(sp =>
        {
            SqlOpenResilienceOptions sqlOpenOpts = sp.GetRequiredService<IOptions<SqlOpenResilienceOptions>>().Value;
            SqlConnectionOpenAttemptTiming openTiming = new();

            ResiliencePipeline pipeline = SqlOpenResilienceDefaults.BuildSqlOpenRetryPipeline(
                sp.GetRequiredService<ILogger<ResilientSqlConnectionFactory>>(),
                sqlOpenOpts.MaxRetryAttempts,
                TimeSpan.FromMilliseconds(sqlOpenOpts.BaseDelayMilliseconds),
                () => openTiming.ElapsedMilliseconds);

            return new ResilientSqlConnectionFactory(
                sp.GetRequiredService<ScopedRoutingSqlConnectionFactory>(),
                pipeline,
                openTiming);
        });

        services.AddScoped<ISqlConnectionFactory>(static sp =>
            sp.GetRequiredService<ResilientSqlConnectionFactory>());

        // Empty ArchLucid:Persistence:ReadOnlyConnectionStringTemplate → ReadOnlyDbConnectionFactory uses primary.
        services.AddScoped<IReadOnlyDbConnectionFactory>(sp => new ReadOnlyDbConnectionFactory(
            sp.GetRequiredService<ResilientSqlConnectionFactory>(),
            sp.GetRequiredService<ITenantDatabaseResolver>(),
            sp.GetRequiredService<IScopeContextProvider>(),
            sp.GetRequiredService<IOptionsMonitor<ArchLucidPersistenceOptions>>(),
            sp.GetRequiredService<IOptionsMonitor<SqlTopologyOptions>>(),
            sp.GetRequiredService<IOptions<SqlOpenResilienceOptions>>(),
            sp.GetRequiredService<ILogger<ReadOnlyDbConnectionFactory>>(),
            enforceServerCertificateTrust));

        services.AddScoped<ITenantSqlConnectionFactory>(sp =>
            new DelegatingTenantSqlConnectionFactory(sp.GetRequiredService<ISqlConnectionFactory>()));

        services.AddScoped<IAuthorityRunListConnectionFactory>(sp => new ReadReplicaRoutedConnectionFactory(
            sp.GetRequiredService<ResilientSqlConnectionFactory>(),
            sp.GetRequiredService<IOptionsMonitor<SqlServerOptions>>(),
            ReadReplicaQueryRoute.AuthorityRunList,
            sp.GetRequiredService<IOptions<SqlOpenResilienceOptions>>(),
            sp.GetRequiredService<ILogger<ReadReplicaRoutedConnectionFactory>>()));

        services.AddScoped<IGovernanceResolutionReadConnectionFactory>(sp => new ReadReplicaRoutedConnectionFactory(
            sp.GetRequiredService<ResilientSqlConnectionFactory>(),
            sp.GetRequiredService<IOptionsMonitor<SqlServerOptions>>(),
            ReadReplicaQueryRoute.GovernanceResolution,
            sp.GetRequiredService<IOptions<SqlOpenResilienceOptions>>(),
            sp.GetRequiredService<ILogger<ReadReplicaRoutedConnectionFactory>>()));

        services.AddScoped<IGoldenManifestLookupReadConnectionFactory>(sp => new ReadReplicaRoutedConnectionFactory(
            sp.GetRequiredService<ResilientSqlConnectionFactory>(),
            sp.GetRequiredService<IOptionsMonitor<SqlServerOptions>>(),
            ReadReplicaQueryRoute.GoldenManifestLookup,
            sp.GetRequiredService<IOptions<SqlOpenResilienceOptions>>(),
            sp.GetRequiredService<ILogger<ReadReplicaRoutedConnectionFactory>>()));

        services.AddScoped<ISchemaBootstrapper>(sp =>
        {
            int configuredTimeoutSeconds = sp.GetRequiredService<IOptionsMonitor<ArchLucidPersistenceOptions>>()
                .CurrentValue.DefaultSqlCommandTimeoutSeconds;
            int commandTimeoutSeconds = configuredTimeoutSeconds > 0
                ? configuredTimeoutSeconds
                : SqlCommandTimeouts.ExtendedSeconds;

            return new SqlSchemaBootstrapper(
                new SqlConnectionFactory(schemaBootstrapConnectionString, enforceServerCertificateTrust),
                scriptPath,
                commandTimeoutSeconds);
        });
    }

    private static void RegisterBackgroundWorkerSqlResilience(IServiceCollection services)
    {
        services.AddSingleton<SqlResilientOperationExecutor>(sp =>
        {
            SqlOpenResilienceOptions sqlOpenOpts = sp.GetRequiredService<IOptions<SqlOpenResilienceOptions>>().Value;

            ResiliencePipeline operationPipeline = SqlOpenResilienceDefaults.BuildSqlOperationRetryPipeline(
                sp.GetRequiredService<ILogger<SqlResilientOperationExecutor>>(),
                sqlOpenOpts.MaxRetryAttempts,
                TimeSpan.FromMilliseconds(sqlOpenOpts.BaseDelayMilliseconds));

            return new SqlResilientOperationExecutor(operationPipeline);
        });

        services.AddSingleton<IBackgroundWorkerSqlConnectionFactory>(sp =>
        {
            SqlOpenResilienceOptions sqlOpenOpts = sp.GetRequiredService<IOptions<SqlOpenResilienceOptions>>().Value;

            ResiliencePipeline openPipeline = SqlOpenResilienceDefaults.BuildSqlOpenRetryPipeline(
                sp.GetRequiredService<ILogger<IBackgroundWorkerSqlConnectionFactory>>(),
                sqlOpenOpts.MaxRetryAttempts,
                TimeSpan.FromMilliseconds(sqlOpenOpts.BaseDelayMilliseconds));

            return new BackgroundWorkerResilientSqlConnectionFactory(
                sp.GetRequiredService<SqlConnectionFactory>(),
                openPipeline);
        });
    }
}
