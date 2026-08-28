using ArchLucid.Application.Advisory;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Analytics;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Analytics;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.Posture;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Provenance;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Repositories;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.ContextIngestion.Repositories;
using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Contracts.Analytics;
using ArchLucid.Core.AdminNotifications;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Feedback;
using ArchLucid.Core.GoToMarket;
using ArchLucid.Core.Marketing;
using ArchLucid.Core.OperationalErrors;
using ArchLucid.Core.Admin;
using ArchLucid.Core.AiProviders;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Identity;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.AwsExtractor;
using ArchLucid.Core.GcpExtractor;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Persistence.ApplicationPorts.Interfaces;
using ArchLucid.Core.Persistence.ApplicationPorts.Findings;
using ArchLucid.Core.Persistence.ApplicationPorts.FineTuning;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Search;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Authorization;
using ArchLucid.Persistence.AwsExtractor;
using ArchLucid.Persistence.GcpExtractor;
using ArchLucid.Persistence.Search;
using ArchLucid.Core.Persistence.ApplicationPorts.Agents;
using ArchLucid.Core.Pilots;
using ArchLucid.Persistence.Agents;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Support;
using ArchLucid.Core.Tenancy;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Learning;
using ArchLucid.Decisioning.Advisory.Workflow;
using ArchLucid.Decisioning.Alerts;
using ArchLucid.Decisioning.Alerts.Composite;
using ArchLucid.Decisioning.Alerts.Delivery;
using ArchLucid.Decisioning.Governance.ComplianceDrift;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Repositories;
using ArchLucid.Host.Composition.GoToMarket;
using ArchLucid.Host.Core.Audit;
using ArchLucid.Host.Core.DataConsistency;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.KnowledgeGraph.Repositories;

using ArchLucid.Persistence.AdminNotifications;
using ArchLucid.Persistence.Advisory;
using ArchLucid.Persistence.Alerts;
using ArchLucid.Persistence.Archival;
using ArchLucid.Persistence.Support;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Conversation;
using ArchLucid.Persistence.Coordination.Compare;
using ArchLucid.Persistence.Coordination.Diagnostics;
using ArchLucid.Persistence.Diagnostics;
using ArchLucid.Persistence.Coordination.Evolution;
using ArchLucid.Persistence.Coordination.ProductLearning;
using ArchLucid.Persistence.Coordination.ProductLearning.Planning;
using ArchLucid.Persistence.Coordination.Replay;
using ArchLucid.Persistence.Coordination.Retrieval;
using ArchLucid.Persistence.Coordination.Export;
using ArchLucid.Persistence.Coordination.Projection;
using ArchLucid.Persistence.Retrieval;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.CustomerSuccess;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Analytics;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Feedback;
using ArchLucid.Persistence.FineTuning;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Governance.Posture;
using ArchLucid.Persistence.Identity;
using ArchLucid.Persistence.AzureExtractor;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Marketing;
using ArchLucid.Persistence.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Persistence.Orchestration.RunStageOutcomes;
using ArchLucid.Persistence.Pilots;
using ArchLucid.Persistence.Roi;
using ArchLucid.Persistence.Provenance;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.OperationalErrors;
using ArchLucid.Persistence.Scim;
using ArchLucid.Persistence.Telemetry;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Tenancy.Diagnostics;
using ArchLucid.Persistence.Transactions;
using ArchLucid.Persistence.Value;
using ArchLucid.Persistence.WeeklyDigest;
using ArchLucid.Provenance;

using Azure.Storage.Blobs;


namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class InMemoryStorageProviderRegistrar
{
    private static void RegisterIntegrationsBilling(IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<ITenantHardPurgeService, NoOpTenantHardPurgeService>();
        services.AddSingleton<IPlatformAuditRepository, NoOpPlatformAuditRepository>();
        services.AddSingleton<IOperationalErrorRepository, NoOpOperationalErrorRepository>();
        services.AddSingleton<ITenantBlobPrefixDeletionService, NoOpTenantBlobPrefixDeletionService>();
        services.AddScoped<ITenantDeletionService, TenantDeletionService>();
        services.AddScoped<ITenantErasureCommandService, TenantErasureCommandService>();
        services.AddScoped<ITenantSuspendCommandService, TenantSuspendCommandService>();
        services.AddSingleton<IBillingLedger, InMemoryBillingLedger>();
        services.AddSingleton<ITenantCustomerSuccessRepository, InMemoryTenantCustomerSuccessRepository>();
        services.AddSingleton<ICorePilotTeamChecklistRepository, InMemoryCorePilotTeamChecklistRepository>();
        services.AddSingleton<IOperatorStickinessSnapshotReader, InMemoryOperatorStickinessSnapshotReader>();
        services.AddSingleton<IAdminTenantHealthReader, InMemoryAdminTenantHealthReader>();
        services.AddSingleton<IUsageEventRepository, InMemoryUsageEventRepository>();
        services.AddSingleton<ILlmTenantBudgetRepository, InMemoryLlmTenantBudgetRepository>();
        services.AddSingleton<IAiUsageEventRepository, Persistence.AiUsage.InMemoryAiUsageEventRepository>();
        services.AddSingleton<ITenantAiBudgetPolicyRepository, Persistence.AiUsage.InMemoryTenantAiBudgetPolicyRepository>();
        services.AddSingleton<ILlmTenantWalletRepository, InMemoryLlmTenantWalletRepository>();
        services.AddSingleton<IMarketingPricingQuoteRequestRepository, NoOpMarketingPricingQuoteRequestRepository>();
        services.AddSingleton<IMarketingPricingQuoteRequestAgingReader, NoOpMarketingPricingQuoteRequestAgingReader>();
        services.AddSingleton<IMarketingPricingQuoteRequestFollowUpRepository, NoOpMarketingPricingQuoteRequestFollowUpRepository>();
        services.AddSingleton<IMarketingEarlyAccessRequestRepository, NoOpMarketingEarlyAccessRequestRepository>();
        services.AddSingleton<ITenantMarketingAttributionRepository, NoOpTenantMarketingAttributionRepository>();
        services.AddSingleton<IFirstTenantFunnelEventStore, NoopFirstTenantFunnelEventStore>();
        services.AddSingleton<IFirstTenantFunnelArchivalBatchStore, NoOpFirstTenantFunnelArchivalBatchStore>();
        services.AddSingleton<IItsmFindingCorrelationRepository, InMemoryItsmFindingCorrelationRepository>();
        services.AddSingleton<IRunFindingExternalTrackingReadRepository, InMemoryRunFindingExternalTrackingReadRepository>();
        services.AddSingleton<ITenantItsmOutboundSettingsRepository, InMemoryTenantItsmOutboundSettingsRepository>();
        services.AddSingleton<ITenantAzureBoardsOutboundSettingsRepository, InMemoryTenantAzureBoardsOutboundSettingsRepository>();
        services.AddSingleton<ITenantItsmConnectorConnectionRepository, InMemoryTenantItsmConnectorConnectionRepository>();
        services.AddSingleton<ITenantSettingsRepository, InMemoryTenantSettingsRepository>();
        services.AddSingleton<IFineTuningManifestConsentReader, TenantSettingsFineTuningManifestConsentReader>();
        services.AddSingleton<IFineTuningTrainingExportAuditRepository, InMemoryFineTuningTrainingExportAuditRepository>();
        services.AddSingleton<ITenantHostedExtractorConfigurationRepository, InMemoryTenantHostedExtractorConfigurationRepository>();
        services.AddSingleton<ITenantAwsConnectionRepository, InMemoryTenantAwsConnectionRepository>();
        services.AddSingleton<ITenantGcpConnectionRepository, InMemoryTenantGcpConnectionRepository>();
        services.AddSingleton<IGlobalSearchRepository, InMemoryGlobalSearchRepository>();
        services.AddSingleton<ITenantFirstValueReportBrandingRepository, InMemoryTenantFirstValueReportBrandingRepository>();
        services.AddScoped<ItsmInboundDispositionSync>();
        services.AddScoped<ItsmInboundWebhookSyncSupport>();
        services.AddScoped<ItsmInboundJiraWebhookProcessor>();
        services.AddScoped<ItsmInboundServiceNowWebhookProcessor>();
        services.AddScoped<ItsmInboundWebhookSyncService>();

        ArchLucidStorageServiceCollectionExtensions.RegisterHostLeaderLeaseInfrastructure(services);
        services.AddSingleton<IHostLeaderLeaseRepository, NoOpHostLeaderLeaseRepository>();
        services.AddSingleton<IRunExecuteOwnershipLeaseRepository, NoOpRunExecuteOwnershipLeaseRepository>();

        ArchLucidStorageServiceCollectionExtensions.RegisterArtifactLargePayloadBlobStore(services, configuration);
        ArchLucidStorageServiceCollectionExtensions.RegisterHotPathReadCaching(services, configuration);
        ArchLucidStorageServiceCollectionExtensions.RegisterSharedDistributedCacheAndLlmCompletion(services, configuration);

        services.AddSingleton<IOutboxOperationalMetricsReader, InMemoryOutboxOperationalMetricsReader>();
        services.AddSingleton<IStaleInFlightRunMetricsReader, InMemoryStaleInFlightRunMetricsReader>();
        services.AddScoped<IAdminOutboxSnapshotReader, InMemoryAdminOutboxSnapshotReader>();
        services.AddSingleton<ITrialFunnelOperationalMetricsReader, InMemoryTrialFunnelOperationalMetricsReader>();
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
        services.AddHostedService<LlmTenantBudgetUtilizationMetricsHostedService>();
        services.AddHostedService<QuickScanBudgetReconciliationHostedService>();
        services.AddHostedService<LlmMonthlyTenantBudgetReservationReclaimHostedService>();
        services.AddHostedService<MarketingPricingQuoteAgingMetricsHostedService>();

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
