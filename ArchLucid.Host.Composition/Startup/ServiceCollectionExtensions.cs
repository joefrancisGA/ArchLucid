using ArchLucid.AgentRuntime;
using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Templates;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Composition.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Startup;
using ArchLucid.Host.Core.Diagnostics;
using ArchLucid.Host.Core.Hosting;
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
        services.AddSingleton<StartupMigrationHealthState>();
        services.AddSingleton<TemplateProvider>();
        services.AddSingleton(TimeProvider.System);
        services.Configure<DemoOptions>(configuration.GetSection(DemoOptions.SectionName));
        services.AddHttpClient(nameof(ConfigurationHealthProbe), static client =>
        {
            client.Timeout = TimeSpan.FromSeconds(15);
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
        RegisterBilling(services, configuration);
        RegisterAdvisoryScheduling(services, configuration, hostingRole);
        RegisterExecDigestServices(services);
        RegisterWeeklyArchitectureDigest(services, configuration);
        RegisterTrialLifecycleEmailHostedServices(services, configuration, hostingRole);
        RegisterExecDigestWorkerInfrastructure(services, configuration, hostingRole);
        RegisterWeeklyArchitectureDigestWorkerInfrastructure(services, configuration, hostingRole);
        RegisterTrialLifecycleScheduler(services, configuration, hostingRole);
        RegisterTrialArchitecturePreseed(services, configuration, hostingRole);
        RegisterTenantHealthScoring(services, configuration, hostingRole);
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
        RegisterRetrievalIndexingOutbox(services, hostingRole);
        RegisterIntegrationEventOutbox(services, hostingRole);
        RegisterIntegrationEventConsumer(services, configuration, hostingRole);
        RegisterDataArchivalHostedService(services, configuration, hostingRole);
        RegisterFirstTenantFunnelArchivalHostedService(services, configuration, hostingRole);
        RegisterDataConsistencyReconciliation(services, configuration, hostingRole);
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
        services.AddHttpClient<JiraOutboundIssueClient>(static client => client.Timeout = TimeSpan.FromSeconds(60));
        services.AddHttpClient<ServiceNowOutboundIncidentClient>(static client => client.Timeout = TimeSpan.FromSeconds(60));
        services.AddScoped<ItsmOutboundIssueCreationService>();
        RegisterScimProvisioning(services, configuration);

        return services;
    }
}
