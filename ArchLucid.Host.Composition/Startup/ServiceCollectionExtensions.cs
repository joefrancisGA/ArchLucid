using ArchLucid.AgentRuntime;
using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Application.Reporting;
using ArchLucid.Core.Evidence;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Templates;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Http;
using ArchLucid.Host.Composition.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Diagnostics;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Http;
using ArchLucid.Host.Core.Startup;
using ArchLucid.Persistence.Archival;

namespace ArchLucid.Host.Composition.Startup;

/// <summary>
/// Composition root for ArchLucid application services. Registration is split across partial files by subsystem
/// (scheduling, data plane, jobs, pipeline, coordinator, agents, decisioning).
/// </summary>
public static partial class ServiceCollectionExtensions
{
    /// <summary>
    /// Registers ArchLucid domain services, persistence choices, hosted workers, and health checks for the given host role.
    /// </summary>
    public static IServiceCollection AddArchLucidApplicationServices(
        this IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        services.AddHostedService<ConfigurationValidationHostedService>();
        services.AddHostedService<OidcAuthorityStartupProbeHostedService>();
        services.AddHostedService<SamlSigningCertificateStartupWarningHostedService>();
        services.AddSingleton<StartupMigrationHealthState>();
        services.AddSingleton<ExportFormatterService>();
        services.AddSingleton<TemplateProvider>();
        services.AddSingleton(TimeProvider.System);
        services.Configure<DemoOptions>(configuration.GetSection(DemoOptions.SectionName));
        services.Configure<OutboundExternalHttpResilienceOptions>(
            configuration.GetSection(OutboundExternalHttpResilienceOptions.SectionName));
        services.PostConfigure<OutboundExternalHttpResilienceOptions>(static o => o.Normalize());
        services.AddHttpClient(nameof(ConfigurationHealthProbe), static client =>
        {
            client.Timeout = TimeSpan.FromSeconds(OutboundHttpClientTimeoutSeconds.InternalLoopbackProbe);
        });
        services.AddScoped<IConfigurationHealthProbe>(sp =>
            new ConfigurationHealthProbe(
                sp.GetRequiredService<IConfiguration>(),
                sp.GetService<Persistence.Connections.ISqlConnectionFactory>(),
                sp.GetRequiredService<IHttpClientFactory>()));
        RegisterAzureArmAndRetailPricesHttpClients(services);
        services.AddScoped<Application.Diagnostics.ISyntheticOperatorDemoPackWriter,
            Application.Diagnostics.SyntheticOperatorDemoPackWriter>();
        services.AddScoped<Application.Authority.IAuthorityCommittedManifestChainWriter,
            Application.Authority.AuthorityCommittedManifestChainWriter>();
        services.AddSingleton<Application.Findings.IReasoningSummaryBuilder, Application.Findings.ReasoningSummaryBuilder>();
        RegisterAzureOpenAiCircuitBreakerOptions(services, configuration);
        services.Configure<BatchReplayOptions>(configuration.GetSection(BatchReplayOptions.SectionName));
        services.Configure<ApiDeprecationOptions>(configuration.GetSection(ApiDeprecationOptions.SectionName));
        services.Configure<DataArchivalOptions>(configuration.GetSection(DataArchivalOptions.SectionName));
        services.Configure<AzureExtractorAutoPullOptions>(
            configuration.GetSection(AzureExtractorAutoPullOptions.SectionName));
        services.Configure<ArchitectureProjectRetentionPurgeOptions>(
            configuration.GetSection(ArchitectureProjectRetentionPurgeOptions.SectionName));
        services.Configure<SampleRunPurgeOptions>(
            configuration.GetSection(SampleRunPurgeOptions.SectionName));
        services.Configure<TenantErasurePurgeOptions>(configuration.GetSection(TenantErasurePurgeOptions.SectionName));
        services.Configure<OrphanedTenantCatalogCleanupOptions>(
            configuration.GetSection(OrphanedTenantCatalogCleanupOptions.SectionName));
        services.Configure<DatabaseLivenessHealthCheckOptions>(
            configuration.GetSection(DatabaseLivenessHealthCheckOptions.SectionName));
        services.Configure<HostLeaderElectionOptions>(configuration.GetSection(HostLeaderElectionOptions.SectionName));
        services.AddScoped<IDemoSeedService, DemoSeedService>();
        services.AddKeyedScoped<IArchitectureRunExecuteOrchestrator>(
            ArchitectureRunExecuteOrchestrationKeys.QuickStartForcedSimulator,
            static (sp, _) => ActivatorUtilities.CreateInstance<ArchitectureRunExecuteOrchestrator>(
                sp,
                sp.GetRequiredService<SimulatorExecutionTraceRecordingExecutor>()));
        services.AddArchLucidFeatureManagement(configuration);
        services.AddArchLucidStorage(configuration);
        RegisterTenancyMeteringAndSecrets(services, configuration);
        services.RegisterBilling(configuration);
        RegisterAdvisoryScheduling(services, configuration, hostingRole);
        RegisterExecDigestServices(services);
        RegisterWeeklyExecutiveSummaryServices(services, configuration);
        RegisterWeeklyArchitectureDigest(services, configuration);
        RegisterTrialLifecycleEmailHostedServices(services, configuration, hostingRole);
        RegisterExecDigestWorkerInfrastructure(services, configuration, hostingRole);
        RegisterWeeklyExecutiveSummaryWorkerInfrastructure(services, configuration, hostingRole);
        RegisterWeeklyArchitectureDigestWorkerInfrastructure(services, configuration, hostingRole);
        RegisterTrialLifecycleScheduler(services, configuration, hostingRole);
        RegisterTrialArchitecturePreseed(services, configuration, hostingRole);
        RegisterTenantHealthScoring(services, configuration, hostingRole);
        RegisterInternalCrossTenantAnalytics(services, configuration, hostingRole);
        RegisterDigestDelivery(services, configuration);
        RegisterIntegrationEventPublishing(services, configuration);
        RegisterTrialLifecycleAuditEmailPublishing(services);
        RegisterAlerts(services);
        RegisterBackgroundJobs(services, configuration, hostingRole);
        RegisterRunExportAndArchitectureAnalysis(services, configuration);
        RegisterComparisonReplayAndDrift(services, configuration);
        RegisterRunReplayManifestAndDiffs(services, configuration);
        RegisterContextIngestionAndKnowledgeGraph(services, configuration);
        RegisterDecisioningEngines(services, configuration);
        RegisterCoordinatorDecisionEngineAndRepositories(services, configuration);
        RegisterArtifactSynthesis(services);
        RegisterAgentExecution(services, configuration);
        RegisterRetrieval(services, configuration);
        RegisterGovernance(services, configuration);
        services.Configure<AuthorityPipelineWorkProcessorOptions>(
            configuration.GetSection(AuthorityPipelineWorkProcessorOptions.SectionName));
        services.Configure<RetrievalIndexingOutboxProcessorOptions>(
            configuration.GetSection(RetrievalIndexingOutboxProcessorOptions.SectionName));
        RegisterRetrievalIndexingOutbox(services, hostingRole);
        RegisterIntegrationEventOutbox(services, hostingRole);
        RegisterIntegrationEventConsumer(services, configuration, hostingRole);
        RegisterAzureDevOpsCommitStatusPublisher(services, configuration);
        RegisterDataArchivalHostedService(services, configuration, hostingRole);
        RegisterAgentResultBlobCleanupHostedService(services, configuration, hostingRole);
        RegisterExecutiveRoiCacheWarmupHostedService(services, configuration, hostingRole);
        RegisterExecutiveRoiSavingsGaugeHostedService(services, configuration, hostingRole);
        RegisterFirstTenantFunnelArchivalHostedService(services, configuration, hostingRole);
        RegisterArchitectureProjectRetentionPurgeHostedService(services, hostingRole);
        RegisterSampleRunTtlHostedService(services, hostingRole);
        RegisterTenantErasureEligiblePurgeHostedService(services, hostingRole);
        RegisterOrphanedTenantCleanupHostedService(services, hostingRole);
        RegisterAzureExtractorAutoPullHostedService(services, hostingRole);
        RegisterWarmTenantCatalogReplenishHostedService(services, hostingRole);
        RegisterDataConsistencyReconciliation(services, configuration, hostingRole);
        services.Configure<SqlConnectionHealthCheckOptions>(
            configuration.GetSection(SqlConnectionHealthCheckOptions.SectionName));
        RegisterArchLucidHealthChecks(services, configuration, hostingRole);
        RegisterCosmosPolyglotPersistence(services, configuration);
        RegisterArchLucidJobRunners(services, configuration);
        services.AddFirstTenantFunnelTelemetry(configuration);
        services.Configure<IntegrationsItsmInboundOptions>(
            configuration.GetSection(IntegrationsItsmInboundOptions.SectionName));
        services.Configure<IntegrationsItsmOutboundOptions>(
            configuration.GetSection(IntegrationsItsmOutboundOptions.SectionName));
        services.Configure<ConfluencePublishingOptions>(
            configuration.GetSection(ConfluencePublishingOptions.SectionName));
        services.AddHttpClient<JiraOutboundIssueClient>(static client => client.Timeout = TimeSpan.FromSeconds(60))
            .AddOutboundExternalHttpResilience();
        services.AddHttpClient<ServiceNowOutboundIncidentClient>(static client => client.Timeout = TimeSpan.FromSeconds(60))
            .AddOutboundExternalHttpResilience();
        services
            .AddHttpClient(
                ItsmOutboundIntegrationHealthLimits.HttpClientName,
                static client => client.Timeout = TimeSpan.FromSeconds(ItsmOutboundIntegrationHealthLimits.NetworkTimeoutSeconds))
            .AddOutboundExternalHttpResilience();
        services.AddScoped<IItsmOutboundIntegrationHealthService, ItsmOutboundIntegrationHealthService>();
        services.AddScoped<ItsmOutboundIssueCreationService>();
        services.Configure<EvidenceBulkUploadOptions>(
            configuration.GetSection(EvidenceBulkUploadOptions.SectionName));
        services.Configure<ZipEvidenceExpanderOptions>(
            configuration.GetSection(ZipEvidenceExpanderOptions.SectionName));
        services.AddSingleton<IZipEvidenceExpanderService, ZipEvidenceExpanderService>();
        services.AddScoped<IBulkEvidenceUploadService, BulkEvidenceUploadService>();
        RegisterScimProvisioning(services, configuration);
        RegisterCorePersistencePortCompatibilityServices(services);

        return services;
    }
}
