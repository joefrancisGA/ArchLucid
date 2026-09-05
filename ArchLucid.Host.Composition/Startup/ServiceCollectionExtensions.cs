using ArchLucid.AgentRuntime;
using ArchLucid.Application.AiProviders;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Clarifications;
using ArchLucid.Application.Billing;
using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Bootstrap.Seeders;
using ArchLucid.Application.Integrations;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Integrations.AzureBoards;
using ArchLucid.Application.Integrations.AzureBoards.Outbound;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Integrations.Itsm.OAuth;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Application.Reporting;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Intake;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Templates;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Http;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Host.Composition.Configuration;
using ArchLucid.Host.Composition.Services;
using ArchLucid.Host.Composition.Startup.Modules;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Diagnostics;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Persistence.Archival;
using ArchLucid.Persistence.Integrations;

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
        RegisterHostedStartupProbes(services, configuration);
        services.AddSingleton<ExportFormatterService>();
        services.AddSingleton<TemplateProvider>();
        services.AddSingleton(TimeProvider.System);
        services.Configure<DemoOptions>(configuration.GetSection(DemoOptions.SectionName));
        services.Configure<DiagramVisionOptions>(configuration.GetSection(DiagramVisionOptions.SectionName));
        services.Configure<OutboundExternalHttpResilienceOptions>(
            configuration.GetSection(OutboundExternalHttpResilienceOptions.SectionName));
        services.PostConfigure<OutboundExternalHttpResilienceOptions>(static o => o.Normalize());
        RegisterAzureArmAndRetailPricesHttpClients(services);
        RegisterMultiCloudPublicPricingHttpClients(services);
        services.Configure<GcpBillingCatalogOptions>(configuration.GetSection(GcpBillingCatalogOptions.SectionName));
        services.AddScoped<Application.Diagnostics.ISyntheticOperatorDemoPackWriter,
            Application.Diagnostics.SyntheticOperatorDemoPackWriter>();

        ArchLucidOptions archLucidOptionsForDiagnostics =
            ArchLucidConfigurationBridge.ResolveArchLucidOptions(configuration);

        if (ArchLucidOptions.EffectiveIsSql(archLucidOptionsForDiagnostics.StorageProvider))
        {
            services.AddScoped<Application.Diagnostics.IDevelopmentCatalogResetService,
                DevelopmentCatalogResetService>();
        }
        else
        {
            services.AddScoped<Application.Diagnostics.IDevelopmentCatalogResetService,
                InMemoryDevelopmentCatalogResetService>();
        }

        services.AddScoped<Application.Authority.IAuthorityCommittedManifestChainWriter,
            Application.Authority.AuthorityCommittedManifestChainWriter>();
        services.AddSingleton<Application.Findings.IReasoningSummaryBuilder, Application.Findings.ReasoningSummaryBuilder>();
        services.Configure<BatchReplayOptions>(configuration.GetSection(BatchReplayOptions.SectionName));
        services.Configure<ApiDeprecationOptions>(configuration.GetSection(ApiDeprecationOptions.SectionName));
        services.Configure<DataArchivalOptions>(configuration.GetSection(DataArchivalOptions.SectionName));
        services.Configure<AzureExtractorAutoPullOptions>(
            configuration.GetSection(AzureExtractorAutoPullOptions.SectionName));
        services.Configure<ArchitectureProjectRetentionPurgeOptions>(
            configuration.GetSection(ArchitectureProjectRetentionPurgeOptions.SectionName));
        services.Configure<SampleRunPurgeOptions>(
            configuration.GetSection(SampleRunPurgeOptions.SectionName));
        services.Configure<DraftIntakeReaperOptions>(
            configuration.GetSection(DraftIntakeReaperOptions.SectionName));
        services.Configure<DraftIntakeBranchOptions>(
            configuration.GetSection(DraftIntakeBranchOptions.SectionName));
        services.Configure<DraftSemanticAdmissionOptions>(
            configuration.GetSection(DraftSemanticAdmissionOptions.SectionName));
        services.Configure<TenantErasurePurgeOptions>(configuration.GetSection(TenantErasurePurgeOptions.SectionName));
        services.Configure<OrphanedTenantCatalogCleanupOptions>(
            configuration.GetSection(OrphanedTenantCatalogCleanupOptions.SectionName));
        services.Configure<DatabaseLivenessHealthCheckOptions>(
            configuration.GetSection(DatabaseLivenessHealthCheckOptions.SectionName));
        services.Configure<HostLeaderElectionOptions>(configuration.GetSection(HostLeaderElectionOptions.SectionName));
        services.AddDemoSeedScenarioSeeders();
        services.AddScoped<IDemoSeedService, DemoSeedService>();
        services.AddKeyedScoped<IArchitectureRunExecuteOrchestrator>(
            ArchitectureRunExecuteOrchestrationKeys.QuickStartForcedSimulator,
            static (sp, _) => ActivatorUtilities.CreateInstance<ArchitectureRunExecuteOrchestrator>(
                sp,
                sp.GetRequiredService<SimulatorExecutionTraceRecordingExecutor>()));
        services.AddArchLucidFeatureManagement(configuration);
        services.AddArchLucidStorage(configuration);
        OperationalErrorsCompositionRegistrar.Register(services, configuration, hostingRole);
        services.AddArchLucidAiUsageControls(configuration);
        RegisterTenancyMeteringAndSecrets(services, configuration);
        services.RegisterBilling(configuration);
        RegisterAdvisoryScheduling(services, configuration, hostingRole);
        WeeklyDigestCompositionModule.Register(services, configuration, hostingRole);
        TrialLifecycleCompositionModule.Register(services, configuration, hostingRole);
        RegisterTenantHealthScoring(services, configuration, hostingRole);
        RegisterInternalCrossTenantAnalytics(services, configuration, hostingRole);
        RegisterDigestDelivery(services, configuration);
        RegisterIntegrationEventPublishing(services, configuration);
        AlertsCompositionModule.Register(services, configuration);
        PipelineCompositionModule.Register(services, configuration);
        InfraEvidenceCompositionModule.Register(services);
        RegisterDecisioningEngines(services, configuration);
        CoordinatorArtifactsCompositionModule.Register(services, configuration);
        AgentCompositionModule.Register(services, configuration);
        RetrievalCompositionModule.Register(services, configuration);
        RegisterGovernance(services, configuration);
        services.AddArchitectureIntelligence();
        services.AddReviewClarificationQuestions();
        services.Configure<ArchitectureIntelligencePipelineOptions>(
            configuration.GetSection(ArchitectureIntelligencePipelineOptions.SectionPath));
        services.Configure<AuthorityPipelineWorkProcessorOptions>(
            configuration.GetSection(AuthorityPipelineWorkProcessorOptions.SectionName));
        services.Configure<RetrievalIndexingOutboxProcessorOptions>(
            configuration.GetSection(RetrievalIndexingOutboxProcessorOptions.SectionName));
        services.Configure<CosmosGraphSnapshotOutboxProcessorOptions>(
            configuration.GetSection(CosmosGraphSnapshotOutboxProcessorOptions.SectionName));
        services.Configure<RunExportBlobPushOutboxProcessorOptions>(
            configuration.GetSection(RunExportBlobPushOutboxProcessorOptions.SectionName));
        services.Configure<PostCommitProjectionOutboxProcessorOptions>(
            configuration.GetSection(PostCommitProjectionOutboxProcessorOptions.SectionName));
        RegisterRetrievalIndexingOutbox(services, hostingRole);
        RegisterRunExportBlobPushOutbox(services, hostingRole);
        RegisterPostCommitProjectionOutbox(services, hostingRole);
        RegisterCosmosGraphSnapshotOutbox(services, configuration, hostingRole);
        RegisterIntegrationEventOutbox(services, hostingRole);
        RegisterIntegrationEventConsumer(services, configuration, hostingRole);
        RegisterAzureDevOpsCommitStatusPublisher(services, configuration);
        RegisterDataArchivalHostedService(services, configuration, hostingRole);
        RegisterAgentResultBlobCleanupHostedService(services, hostingRole);
        RegisterSponsorRoiCacheWarmupHostedService(services, configuration, hostingRole);
        RegisterSponsorRoiSavingsGaugeHostedService(services, configuration, hostingRole);
        RegisterFirstTenantFunnelArchivalHostedService(services, configuration, hostingRole);
        RegisterArchitectureProjectRetentionPurgeHostedService(services, hostingRole);
        RegisterSampleRunTtlHostedService(services, hostingRole);
        RegisterDraftIntakeReaperHostedService(services, hostingRole);
        RegisterWaiverExpiryNotificationHostedService(services, hostingRole);
        RegisterTenantErasureEligiblePurgeHostedService(services, hostingRole);
        RegisterOrphanedTenantCleanupHostedService(services, hostingRole);
        RegisterAzureExtractorAutoPullHostedService(services, hostingRole);
        RegisterAwsExtractorAutoPullHostedService(services, hostingRole);
        RegisterGcpExtractorAutoPullHostedService(services, hostingRole);
        RegisterWarmTenantCatalogReplenishHostedService(services, hostingRole);
        DataHealthJobsCompositionModule.Register(services, configuration, hostingRole);
        services.Configure<SqlConnectionHealthCheckOptions>(
            configuration.GetSection(SqlConnectionHealthCheckOptions.SectionName));
        RegisterCosmosPolyglotPersistence(services, configuration);
        RegisterArchLucidJobRunners(services, configuration);
        services.AddFirstTenantFunnelTelemetry(configuration);
        services.Configure<IntegrationsItsmInboundOptions>(
            configuration.GetSection(IntegrationsItsmInboundOptions.SectionName));
        services.Configure<IntegrationsItsmOptions>(
            configuration.GetSection(IntegrationsItsmOptions.SectionName));
        services.Configure<IntegrationsItsmOutboundOptions>(
            configuration.GetSection(IntegrationsItsmOutboundOptions.SectionName));
        services.AddSingleton<ItsmNativeIntegrationGate>();
        services.Configure<ConfluencePublishingOptions>(
            configuration.GetSection(ConfluencePublishingOptions.SectionName));
        RegisterIntegrationsOutboundHttpClients(services);
        services.AddScoped<JiraExternalTicketConnector>();
        services.AddScoped<ServiceNowExternalTicketConnector>();
        services.AddScoped<AzureBoardsExternalTicketConnector>();
        services.AddScoped<IExternalTicketConnectorRegistry>(static sp =>
            new ExternalTicketConnectorRegistry(
            [
                sp.GetRequiredService<JiraExternalTicketConnector>(),
                sp.GetRequiredService<ServiceNowExternalTicketConnector>(),
                sp.GetRequiredService<AzureBoardsExternalTicketConnector>()
            ]));
        services.AddScoped<IItsmOutboundIntegrationHealthService, ItsmOutboundIntegrationHealthService>();
        services.AddScoped<ITenantItsmOutboundSettingsService, TenantItsmOutboundSettingsService>();
        services.AddScoped<ITenantAzureOpenAiConnectionService, TenantAzureOpenAiConnectionService>();
        services.AddScoped<ITenantAzureOpenAiConnectionProbeService, TenantAzureOpenAiConnectionProbeService>();
        services.AddScoped<Application.Diagnostics.IWorkspaceAiAvailabilityService, WorkspaceAiAvailabilityService>();
        services.AddScoped<Application.Diagnostics.IAgentExecutionReadinessGuard, AgentExecutionReadinessGuard>();
        services.AddScoped<ITeamsIncomingWebhookConnectionProbeService, TeamsIncomingWebhookConnectionProbeService>();
        services.AddScoped<IMarketplaceWebhookConnectivityService, MarketplaceWebhookConnectivityService>();
        services.AddScoped<IItsmTenantConnectorCredentialResolver, ItsmTenantConnectorCredentialResolver>();
        services.AddSingleton<IItsmInboundWebhookReplayGuard, MemoryCacheItsmInboundWebhookReplayGuard>();
        services.AddSingleton<ItsmConnectorOAuthAccessTokenCache>();
        services.AddScoped<IItsmAtlassianOAuthConsentService, ItsmAtlassianOAuthConsentService>();
        services.AddScoped<IItsmOutboundHttpAuthenticator, ItsmOutboundHttpAuthenticator>();
        services.AddScoped<IItsmOutboundIssueCreationService, ItsmOutboundIssueCreationService>();
        services.AddScoped<ItsmOutboundIssueCreationService>();
        services.AddScoped<IAzureBoardsIntegrationService, AzureBoardsIntegrationService>();
        services.AddScoped<ItsmExternalTicketUrlBuilder>();
        services.AddScoped<ItsmFindingCorrelationQueryService>();
        services.AddScoped<RunFindingExternalTrackingEnrichmentService>();
        services.Configure<EvidenceBulkUploadOptions>(
            configuration.GetSection(EvidenceBulkUploadOptions.SectionName));
        services.Configure<ZipEvidenceExpanderOptions>(
            configuration.GetSection(ZipEvidenceExpanderOptions.SectionName));
        services.AddSingleton<IZipEvidenceExpanderService, ZipEvidenceExpanderService>();
        services.AddScoped<IBulkEvidenceUploadService, BulkEvidenceUploadService>();
        services.AddSingleton<IEvidenceAddedIncrementalReReviewQueue, EvidenceAddedIncrementalReReviewQueue>();
        services.AddScoped<IEvidenceAddedIncrementalReReviewCoordinator, EvidenceAddedIncrementalReReviewCoordinator>();
        services.AddHostedService<EvidenceAddedIncrementalReReviewHostedService>();
        services.Configure<IncrementalReReviewOnEvidenceAddedOptions>(
            configuration.GetSection(IncrementalReReviewOnEvidenceAddedOptions.SectionName));
        services.AddScoped<IWizardIntakeDraftService, WizardIntakeDraftService>();
        RegisterScimProvisioning(services, configuration, hostingRole);
        RegisterCorePersistencePortCompatibilityServices(services);

        return services;
    }
}
