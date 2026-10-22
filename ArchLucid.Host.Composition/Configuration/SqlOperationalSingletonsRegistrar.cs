using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.ApplicationPorts.Interfaces;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Core.Audit;
using ArchLucid.Host.Core.DataAccess;
using ArchLucid.Host.Core.DataConsistency;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Coordination.Diagnostics;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Tenancy.Diagnostics;

namespace ArchLucid.Host.Composition.Configuration;

/// <summary>
///     SQL operational singletons: scoped-resolution connection factory, host leases, funnel/outbox metrics, and orphan probes.
/// </summary>
internal static class SqlOperationalSingletonsRegistrar
{
    public static void Register(
        IServiceCollection services,
        IConfiguration configuration,
        string connectionString)
    {
        services.AddSingleton<IDbConnectionFactory>(p =>
            new SqlScopedResolutionDbConnectionFactory(
                p.GetRequiredService<IServiceScopeFactory>(),
                connectionString,
                p.GetRequiredService<IOptionsMonitor<SqlServerOptions>>()));

        ArchLucidStorageServiceCollectionExtensions.RegisterHostLeaderLeaseInfrastructure(services);
        services.AddSingleton<IHostLeaderLeaseRepository, SqlHostLeaderLeaseRepository>();
        services.AddSingleton<IRunExecuteOwnershipLeaseRepository, SqlRunExecuteOwnershipLeaseRepository>();

        // Scoped: DapperTrialFunnelOperationalMetricsReader takes ISqlConnectionFactory (scoped); hosted service resolves it per scope.
        services.AddScoped<ITrialFunnelOperationalMetricsReader, DapperTrialFunnelOperationalMetricsReader>();
        services.AddScoped<ITrialFunnelCommitHook, SqlTrialFunnelCommitHook>();
        services.AddScoped<ITenantOnboardingStateRepository, SqlTenantOnboardingStateRepository>();
        services.AddScoped<IFirstSessionLifecycleHook, SqlFirstSessionLifecycleHook>();

        services.AddScoped<IOutboxOperationalMetricsReader, DapperOutboxOperationalMetricsReader>();
        services.AddScoped<IStaleInFlightRunMetricsReader, DapperStaleInFlightRunMetricsReader>();
        services.AddScoped<IAdminOutboxSnapshotReader, DapperAdminOutboxSnapshotReader>();
        services.AddHostedService<OutboxOperationalMetricsHostedService>();
        services.AddHostedService<StaleInFlightRunMetricsHostedService>();
        services.AddHostedService<LlmTenantBudgetUtilizationMetricsHostedService>();
        services.AddHostedService<QuickScanBudgetReconciliationHostedService>();
        services.AddHostedService<LlmMonthlyTenantBudgetReservationReclaimHostedService>();
        services.AddHostedService<MarketingPricingQuoteAgingMetricsHostedService>();
        services.AddHostedService<SqlConnectionPoolMetricsHostedService>();
        services.Configure<SqlConnectionPoolWarmupOptions>(
            configuration.GetSection(SqlConnectionPoolWarmupOptions.SectionPath));
        services.AddHostedService<SqlConnectionPoolWarmupHostedService>();

        services.AddSingleton<DataConsistencyOrphanProbeExecutor>();
        services.AddSingleton<IDataConsistencyOrphanProbeExecutor>(
            static sp => sp.GetRequiredService<DataConsistencyOrphanProbeExecutor>());
        services.AddSingleton<IArchLucidJob, OrphanProbeArchLucidJob>();

        if (!ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.OrphanProbe))

            services.AddHostedService<DataConsistencyOrphanProbeHostedService>();

        services.AddSingleton<RequiredAuditTrailOrphanProbeExecutor>();
        services.AddSingleton<IRequiredAuditTrailOrphanProbeExecutor>(
            static sp => sp.GetRequiredService<RequiredAuditTrailOrphanProbeExecutor>());
        services.AddSingleton<IArchLucidJob, RequiredAuditTrailOrphanProbeArchLucidJob>();

        if (!ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.RequiredAuditTrailOrphanProbe))

            services.AddHostedService<RequiredAuditTrailOrphanProbeHostedService>();
    }
}
