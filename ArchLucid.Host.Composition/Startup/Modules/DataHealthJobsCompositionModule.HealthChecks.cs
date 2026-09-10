using ArchLucid.Application.DataConsistency;
using ArchLucid.Core.Hosting;
using ArchLucid.Host.Composition.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Health;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Jobs;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Host.Composition.Startup.Modules;

partial class DataHealthJobsCompositionModule
{
    private static void RegisterArchLucidHealthChecks(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        IHealthChecksBuilder builder = services.AddHealthChecks()
            .AddCheck(
                "liveness",
                () => HealthCheckResult.Healthy("ArchLucid API process is running."),
                tags: [ReadinessTags.Live])
            .AddCheck<DatabaseLivenessHealthCheck>(
                DatabaseLivenessHealthCheck.RegistrationName,
                failureStatus: HealthStatus.Unhealthy,
                tags: [ReadinessTags.Live])
            .AddCheck<AgentExecutionModeHealthCheck>(
                AgentExecutionModeHealthCheck.RegistrationName,
                tags: [ReadinessTags.Ready])
            .AddCheck<PreCommitGovernanceGateHealthCheck>(
                PreCommitGovernanceGateHealthCheck.RegistrationName,
                tags: [ReadinessTags.Ready])
            .AddCheck<AgentOutputQualityGateModeHealthCheck>(
                AgentOutputQualityGateModeHealthCheck.RegistrationName,
                tags: [ReadinessTags.Ready]);

        AddArchLucidSqlServerDatabaseHealthCheck(builder);

        string? redisProbeConnection =
            RedisHealthProbeConnectionResolver.TryResolveRedisHealthProbeConnectionString(configuration);

        if (!string.IsNullOrEmpty(redisProbeConnection))

            builder.AddCheck(
                "redis",
                new OptionalRedisConnectionHealthCheck(redisProbeConnection),
                failureStatus: HealthStatus.Degraded,
                tags: [ReadinessTags.Ready]);

        builder
            .AddCheck<SqlSystemPlaneHealthCheck>(
                "sql_system_plane",
                failureStatus: HealthStatus.Unhealthy,
                tags: [ReadinessTags.Ready])
            .AddCheck<AzureSqlReadReplicaHealthCheck>(
                AzureSqlReadReplicaHealthCheck.RegistrationName,
                failureStatus: HealthStatus.Unhealthy,
                tags: [ReadinessTags.Ready])
            .AddCheck<RedisGraphProjectionHealthCheck>(
                RedisGraphProjectionHealthCheck.RegistrationName,
                failureStatus: HealthStatus.Unhealthy,
                tags: [ReadinessTags.Ready])
            .AddCheck<SchemaFilesHealthCheck>("schema_files", tags: [ReadinessTags.Ready])
            .AddCheck<ComplianceRulePackHealthCheck>("compliance_rule_pack", tags: [ReadinessTags.Ready])
            .AddCheck<ProcessTempDirectoryHealthCheck>("temp_directory", tags: [ReadinessTags.Ready])
            .AddCheck<BlobStorageHealthCheck>("blob_storage", tags: [ReadinessTags.Ready])
            .AddCheck<RunGoldenManifestConsistencyHealthCheck>(
                "run_golden_manifest_consistency",
                failureStatus: HealthStatus.Degraded,
                tags: [ReadinessTags.Ready])
            .AddCheck<GraphMergeInvariantProbeHealthCheck>(
                GraphMergeInvariantProbeHealthCheck.RegistrationName,
                failureStatus: HealthStatus.Degraded,
                tags: [ReadinessTags.Ready])
            .AddCheck<OrchestratorHealthCheck>(
                OrchestratorHealthCheck.RegistrationName,
                failureStatus: HealthStatus.Degraded,
                tags: [ReadinessTags.Ready])
            .AddCheck<CircuitBreakerHealthCheck>(
                "circuit_breakers",
                failureStatus: HealthStatus.Degraded,
                tags: [])
            .AddCheck<DistributedCacheHealthCheck>(
                OperationalDetailedHealthChecks.DistributedCache,
                failureStatus: HealthStatus.Degraded,
                tags: [])
            .AddCheck<DemoViewerDataHealthCheck>(
                "demo_viewer_data",
                failureStatus: HealthStatus.Degraded,
                tags: [ReadinessTags.Ready])
            .AddCheck<AzureOpenAiHealthCheck>(
                "openai",
                failureStatus: HealthStatus.Unhealthy,
                tags: [ReadinessTags.Ready])
            .AddCheck<VectorStoreHealthCheck>(
                VectorStoreHealthCheck.RegistrationName,
                failureStatus: HealthStatus.Degraded,
                tags: [ReadinessTags.Ready])
            .AddCheck<RetrievalIndexFreshnessHealthCheck>(
                RetrievalIndexFreshnessHealthCheck.RegistrationName,
                failureStatus: HealthStatus.Degraded,
                tags: [ReadinessTags.Ready])
            .AddCheck<KeyVaultHealthCheck>(
                "keyvault",
                failureStatus: HealthStatus.Unhealthy,
                tags: [ReadinessTags.Ready]);

        if (hostingRole is ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker
            && !ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.DataArchival))

            builder.AddCheck<DataArchivalHostHealthCheck>(
                "data_archival",
                failureStatus: HealthStatus.Degraded,
                tags: [ReadinessTags.Ready]);

        if (hostingRole is ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker)

            builder.AddCheck<DataConsistencyHealthCheck>(
                "data_consistency",
                failureStatus: HealthStatus.Unhealthy,
                tags: [ReadinessTags.Ready]);

    }

    /// <summary>
    ///     SQL readiness via <see cref="SqlConnectionHealthCheck" /> (SELECT 1 + latency brownout detection).
    ///     InMemory storage skips the probe.
    /// </summary>
    private static void AddArchLucidSqlServerDatabaseHealthCheck(IHealthChecksBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.AddCheck<SqlConnectionHealthCheck>(
            "database",
            failureStatus: HealthStatus.Unhealthy,
            tags: [ReadinessTags.Ready]);
    }
}
