using ArchLucid.Application.Analytics;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Core.Analytics;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Persistence.ApplicationPorts.Interfaces;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Tenancy;
using ArchLucid.Core.Transactions;
using ArchLucid.Host.Core.Audit;
using ArchLucid.Host.Core.DataConsistency;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Coordination.Diagnostics;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Telemetry;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Transactions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class InMemoryStorageProviderRegistrar
{
    private static void RegisterIntegrationsConnectorsOutboxMetrics(IServiceCollection services, IConfiguration configuration)
    {
        ArchLucidStorageServiceCollectionExtensions.RegisterHostLeaderLeaseInfrastructure(services);
        services.AddSingleton<IHostLeaderLeaseRepository, NoOpHostLeaderLeaseRepository>();
        services.AddSingleton<IRunExecuteOwnershipLeaseRepository, NoOpRunExecuteOwnershipLeaseRepository>();

        ArchLucidStorageServiceCollectionExtensions.RegisterArtifactLargePayloadBlobStore(services, configuration);
        ArchLucidStorageServiceCollectionExtensions.RegisterHotPathReadCaching(services, configuration);
        ArchLucidStorageServiceCollectionExtensions.RegisterSharedDistributedCacheAndLlmCompletion(services, configuration);

        services.AddSingleton<IOutboxOperationalMetricsReader, InMemoryOutboxOperationalMetricsReader>();
        services.AddSingleton<IStaleInFlightRunMetricsReader, InMemoryStaleInFlightRunMetricsReader>();
        services.AddScoped<IAdminOutboxSnapshotReader, InMemoryAdminOutboxSnapshotReader>();
        services.AddSingleton<IInternalCrossTenantMetricsCollector, InMemoryInternalCrossTenantMetricsCollector>();
        services.AddSingleton<IInternalCrossTenantRollupRepository, InMemoryInternalCrossTenantRollupRepository>();
        services.AddSingleton<InternalCrossTenantRollupProcessor>();
        services.AddSingleton<IInternalCrossTenantAnalyticsService, InMemoryInternalCrossTenantAnalyticsService>();
        services.AddScoped<ITrialFunnelCommitHook, SqlTrialFunnelCommitHook>();
        // In-memory hosts intentionally omit ISqlConnectionFactory; first-session SQL persistence is not modeled here.
        services.AddSingleton<IReadOnlyDbConnectionFactory, InMemoryReadOnlyDbConnectionFactory>();
        services.AddSingleton<IFirstSessionLifecycleHook>(NoOpFirstSessionLifecycleHook.Instance);

        services.AddHostedService<OutboxOperationalMetricsHostedService>();
        services.AddHostedService<StaleInFlightRunMetricsHostedService>();

        // Parity with Sql path: orphan probe resolves but no-ops when storage is InMemory (see DataConsistencyOrphanProbeExecutor).
        // IDbConnectionFactory stays UnsupportedRelationalDbConnectionFactory so DAST/ZAP containers need no SQL connection string.
        services.AddSingleton<IDbConnectionFactory, UnsupportedRelationalDbConnectionFactory>();
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

        services.AddArchitectureIntelligenceInMemoryPersistence();
    }
}
