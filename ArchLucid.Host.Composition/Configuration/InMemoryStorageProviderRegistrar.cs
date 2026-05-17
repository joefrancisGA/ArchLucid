using ArchLucid.Application.Advisory;
using ArchLucid.Application.Analytics;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Analytics;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Repositories;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Repositories;
using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Core.AdminNotifications;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Feedback;
using ArchLucid.Core.GoToMarket;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Pilots;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Tenancy;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Learning;
using ArchLucid.Decisioning.Advisory.Workflow;
using ArchLucid.Decisioning.Alerts;
using ArchLucid.Decisioning.Alerts.Composite;
using ArchLucid.Decisioning.Alerts.Delivery;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Repositories;
using ArchLucid.Host.Composition.GoToMarket;
using ArchLucid.Host.Composition.Orchestration;
using ArchLucid.Host.Core.DataConsistency;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.KnowledgeGraph.Repositories;
using ArchLucid.Persistence.AdminNotifications;
using ArchLucid.Persistence.Advisory;
using ArchLucid.Persistence.Alerts;
using ArchLucid.Persistence.Archival;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Conversation;
using ArchLucid.Persistence.Coordination.Compare;
using ArchLucid.Persistence.Coordination.Diagnostics;
using ArchLucid.Persistence.Coordination.Evolution;
using ArchLucid.Persistence.Coordination.ProductLearning;
using ArchLucid.Persistence.Coordination.ProductLearning.Planning;
using ArchLucid.Persistence.Coordination.Replay;
using ArchLucid.Persistence.Coordination.Retrieval;
using ArchLucid.Persistence.CustomerSuccess;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Feedback;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Identity;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Marketing;
using ArchLucid.Persistence.Orchestration;
using ArchLucid.Persistence.Orchestration.Pipeline;
using ArchLucid.Persistence.Pilots;
using ArchLucid.Persistence.Provenance;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Scim;
using ArchLucid.Persistence.Telemetry;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Tenancy.Diagnostics;
using ArchLucid.Persistence.Transactions;
using ArchLucid.Persistence.Value;
using ArchLucid.Persistence.WeeklyDigest;
using ArchLucid.Provenance;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed class InMemoryStorageProviderRegistrar : IStorageProviderRegistrar
{
    public void Register(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<SqlTopologyOptions>(configuration.GetSection(SqlTopologyOptions.SectionPath));

        services.AddSingleton<ISystemSqlConnectionFactory, UnusedSystemSqlConnectionFactory>();
        services.AddSingleton<ITenantSqlConnectionFactory, UnusedTenantSqlConnectionFactory>();
        services.AddScoped<ITenantSqlCatalogProvisioner, NoOpTenantSqlCatalogProvisioner>();
        services.AddSingleton<IContextSnapshotRepository, InMemoryContextSnapshotRepository>();
        services.AddSingleton<IGraphSnapshotRepository, InMemoryGraphSnapshotRepository>();
        services.AddSingleton<IFindingsSnapshotRepository, InMemoryFindingsSnapshotRepository>();
        services.AddSingleton<IFindingRecordMuteRepository, InMemoryFindingRecordMuteRepository>();
        services.AddSingleton<IFindingInspectReadRepository>(sp =>
            new InMemoryFindingInspectReadRepository(sp.GetRequiredService<IAuthorityQueryService>()));
        services.AddSingleton<IDecisionTraceRepository, InMemoryDecisionTraceRepository>();
        services.AddSingleton<IGoldenManifestRepository, InMemoryGoldenManifestRepository>();
        services.AddSingleton<IArtifactBundleRepository, InMemoryArtifactBundleRepository>();
        services.AddSingleton<ITenantRepository, InMemoryTenantRepository>();
        services.AddSingleton<IArchitectureProjectRepository, InMemoryArchitectureProjectRepository>();
        services.AddSingleton<IArchitectureProjectRetentionPurgeService, NoOpArchitectureProjectRetentionPurgeService>();
        services.AddSingleton<IScimTenantTokenRepository, InMemoryScimTenantTokenRepository>();
        services.AddSingleton<IScimUserRepository, InMemoryScimUserRepository>();
        services.AddSingleton<IAdminNotificationsRepository, NoOpAdminNotificationsRepository>();
        services.AddSingleton<IScimGroupRepository, InMemoryScimGroupRepository>();
        services.AddSingleton<IRoiBulletinAggregateReader, InMemoryRoiBulletinAggregateReader>();
        services.AddSingleton<IReferenceEvidenceRunLookup, InMemoryReferenceEvidenceRunLookup>();
        services.AddSingleton<ITenantNotificationChannelPreferencesRepository, InMemoryTenantNotificationChannelPreferencesRepository>();
        services.AddSingleton<ITenantTeamsIncomingWebhookConnectionRepository, InMemoryTenantTeamsIncomingWebhookConnectionRepository>();
        services.AddSingleton<ITenantExecDigestPreferencesRepository, InMemoryTenantExecDigestPreferencesRepository>();
        services.AddSingleton<IWeeklyArchitectureCriticalFindingSummaryRepository,
            InMemoryWeeklyArchitectureCriticalFindingSummaryRepository>();
        services.AddSingleton<ITenantHardPurgeService, NoOpTenantHardPurgeService>();
        services.AddSingleton<IPlatformAuditRepository, NoOpPlatformAuditRepository>();
        services.AddSingleton<ITenantBlobPrefixDeletionService, NoOpTenantBlobPrefixDeletionService>();
        services.AddScoped<ITenantDeletionService, TenantDeletionService>();
        services.AddSingleton<IBillingLedger, InMemoryBillingLedger>();
        services.AddSingleton<ITenantCustomerSuccessRepository, InMemoryTenantCustomerSuccessRepository>();
        services.AddSingleton<ICorePilotTeamChecklistRepository, InMemoryCorePilotTeamChecklistRepository>();
        services.AddSingleton<IOperatorStickinessSnapshotReader, InMemoryOperatorStickinessSnapshotReader>();
        services.AddSingleton<IFindingFeedbackRepository, InMemoryFindingFeedbackRepository>();
        services.AddSingleton<IFindingReviewTrailRepository, NoOpFindingReviewTrailRepository>();
        services.AddSingleton<IImportedArchitectureRequestRepository, NoOpImportedArchitectureRequestRepository>();
        services.AddSingleton<IAzureExtractorPackageRepository, NoOpAzureExtractorPackageRepository>();
        services.AddSingleton<ITrialIdentityUserRepository, InMemoryNoTrialIdentityUserRepository>();
        services.AddSingleton<IRunRepository>(sp =>
            new InMemoryRunRepository(sp.GetRequiredService<ITenantRepository>()));
        services.AddSingleton<ICommittedArchitectureReviewFlagReader, RunRepositoryCommittedArchitectureReviewFlagReader>();
        services.AddSingleton<IAuthorityQueryService, InMemoryAuthorityQueryService>();
        services.AddSingleton<IArtifactQueryService, InMemoryArtifactQueryService>();
        services.AddScoped<IAuthorityCompareService, AuthorityCompareService>();
        services.AddScoped<IAuthorityReplayService, AuthorityReplayService>();
        services.AddSingleton<IAuditRepository, InMemoryAuditRepository>();
        services.AddSingleton<IPilotScorecardMetricsReader, NullPilotScorecardMetricsReader>();
        services.AddSingleton<IPilotReportCardMetricsReader, NullPilotReportCardMetricsReader>();
        services.AddSingleton<IPilotBaselineRepository, InMemoryPilotBaselineRepository>();
        services.AddSingleton<IPilotCloseoutRepository, InMemoryPilotCloseoutRepository>();
        services.AddSingleton<IValueReportMetricsReader, InMemoryValueReportMetricsReader>();
        services.AddScoped<IRunPipelineAuditTimelineService, RunPipelineAuditTimelineService>();
        services.AddSingleton<IProvenanceSnapshotRepository, InMemoryProvenanceSnapshotRepository>();
        services.AddScoped<IProvenanceQueryService, ProvenanceQueryService>();
        services.AddSingleton<IRecommendationRepository, InMemoryRecommendationRepository>();
        services.AddScoped<IRecommendationWorkflowService, RecommendationWorkflowService>();
        services.AddScoped<IRecommendationFeedbackAnalyzer, RecommendationFeedbackAnalyzer>();
        services.AddSingleton<IRecommendationLearningProfileRepository, InMemoryRecommendationLearningProfileRepository>();
        services.AddScoped<IRecommendationLearningService, RecommendationLearningService>();
        services.AddSingleton<IAdvisoryScanScheduleRepository, InMemoryAdvisoryScanScheduleRepository>();
        services.AddSingleton<IAdvisoryScanExecutionRepository, InMemoryAdvisoryScanExecutionRepository>();
        services.AddSingleton<IArchitectureDigestRepository, InMemoryArchitectureDigestRepository>();
        services.AddSingleton<IDigestSubscriptionRepository, InMemoryDigestSubscriptionRepository>();
        services.AddSingleton<IDigestDeliveryAttemptRepository, InMemoryDigestDeliveryAttemptRepository>();
        services.AddSingleton<IAlertRuleRepository, InMemoryAlertRuleRepository>();
        services.AddSingleton<IAlertRecordRepository, InMemoryAlertRecordRepository>();
        services.AddSingleton<IAlertRoutingSubscriptionRepository, InMemoryAlertRoutingSubscriptionRepository>();
        services.AddSingleton<IAlertDeliveryAttemptRepository, InMemoryAlertDeliveryAttemptRepository>();
        services.AddSingleton<ICompositeAlertRuleRepository, InMemoryCompositeAlertRuleRepository>();
        services.AddSingleton<IPolicyPackRepository, InMemoryPolicyPackRepository>();
        services.AddSingleton<IPolicyPackVersionRepository, InMemoryPolicyPackVersionRepository>();
        services.AddSingleton<IPolicyPackAssignmentRepository, InMemoryPolicyPackAssignmentRepository>();
        services.AddSingleton<IPolicyPackChangeLogRepository, InMemoryPolicyPackChangeLogRepository>();
        services.AddSingleton<IArchLucidUnitOfWorkFactory, InMemoryArchLucidUnitOfWorkFactory>();
        services.AddSingleton<IDistributedCreateRunIdempotencyLock, InProcessCreateRunIdempotencyLock>();
        services.AddSingleton<IRetrievalIndexingOutboxRepository, InMemoryRetrievalIndexingOutboxRepository>();
        services.AddSingleton<IIntegrationEventOutboxRepository, InMemoryIntegrationEventOutboxRepository>();
        services.AddSingleton<IProductLearningPilotSignalRepository, InMemoryProductLearningPilotSignalRepository>();
        services.AddSingleton<IProductLearningPlanningRepository, InMemoryProductLearningPlanningRepository>();
        services.AddSingleton<IProductLearningFeedbackAggregationService, ProductLearningFeedbackAggregationService>();
        services.AddSingleton<IProductLearningImprovementOpportunityService, ProductLearningImprovementOpportunityService>();
        services.AddSingleton<IProductLearningDashboardService, ProductLearningDashboardService>();
        services.AddSingleton<IProductLearningPlanningDerivationService, ProductLearningPlanningDerivationService>();
        services.AddSingleton<IEvolutionCandidateChangeSetRepository, InMemoryEvolutionCandidateChangeSetRepository>();
        services.AddSingleton<IEvolutionSimulationRunRepository, InMemoryEvolutionSimulationRunRepository>();
        services.AddSingleton<IConversationThreadRepository, InMemoryConversationThreadRepository>();
        services.AddSingleton<IConversationMessageRepository, InMemoryConversationMessageRepository>();
        services.AddSingleton<IAuthorityPipelineWorkRepository, InMemoryAuthorityPipelineWorkRepository>();
        services.AddSingleton<IAsyncAuthorityPipelineModeResolver, DisabledAsyncAuthorityPipelineModeResolver>();
        services.AddScoped<IAuthorityPipelineStagesExecutor, AuthorityPipelineStagesExecutor>();
        services.AddScoped<IAuthorityCommittedPipelineFinalizer, AuthorityCommittedPipelineFinalizer>();
        services.AddScoped<IAuthorityPipelineStagesExecutionDriver, InlineAuthorityPipelineStagesExecutionDriver>();
        services.AddSingleton<ITenantAuthorityPipelineConcurrencyGate, InMemoryTenantAuthorityPipelineConcurrencyGate>();
        services.AddScoped<AuthorityRunOrchestrator>();
        services.AddScoped<IAuthorityRunOrchestrator, AuthorityRunOrchestratorApplicationAdapter>();
        services.AddScoped<IDataArchivalCoordinator, DataArchivalCoordinator>();
        services.AddSingleton<IUsageEventRepository, InMemoryUsageEventRepository>();
        services.AddSingleton<ILlmTenantBudgetRepository, InMemoryLlmTenantBudgetRepository>();
        services.AddSingleton<IMarketingPricingQuoteRequestRepository, NoOpMarketingPricingQuoteRequestRepository>();
        services.AddSingleton<IMarketingEarlyAccessRequestRepository, NoOpMarketingEarlyAccessRequestRepository>();
        services.AddSingleton<IFirstTenantFunnelEventStore, NoopFirstTenantFunnelEventStore>();
        services.AddSingleton<IFirstTenantFunnelArchivalBatchStore, NoOpFirstTenantFunnelArchivalBatchStore>();
        services.AddSingleton<IItsmFindingCorrelationRepository, InMemoryItsmFindingCorrelationRepository>();
        services.AddSingleton<ITenantItsmOutboundSettingsRepository, InMemoryTenantItsmOutboundSettingsRepository>();
        services.AddSingleton<ITenantFirstValueReportBrandingRepository, InMemoryTenantFirstValueReportBrandingRepository>();
        services.AddScoped<ItsmInboundWebhookSyncService>();

        ArchLucidStorageServiceCollectionExtensions.RegisterHostLeaderLeaseInfrastructure(services);
        services.AddSingleton<IHostLeaderLeaseRepository, NoOpHostLeaderLeaseRepository>();

        ArchLucidStorageServiceCollectionExtensions.RegisterArtifactLargePayloadBlobStore(services, configuration);
        ArchLucidStorageServiceCollectionExtensions.RegisterHotPathReadCaching(services, configuration);
        ArchLucidStorageServiceCollectionExtensions.RegisterSharedDistributedCacheAndLlmCompletion(services, configuration);

        services.AddSingleton<IOutboxOperationalMetricsReader, InMemoryOutboxOperationalMetricsReader>();
        services.AddSingleton<ITrialFunnelOperationalMetricsReader, InMemoryTrialFunnelOperationalMetricsReader>();
        services.AddSingleton<IInternalCrossTenantAnalyticsService, InMemoryInternalCrossTenantAnalyticsService>();
        services.AddScoped<ITrialFunnelCommitHook, SqlTrialFunnelCommitHook>();
        // In-memory hosts intentionally omit ISqlConnectionFactory; first-session SQL persistence is not modeled here.
        services.AddSingleton<IFirstSessionLifecycleHook>(NoOpFirstSessionLifecycleHook.Instance);

        services.AddHostedService<OutboxOperationalMetricsHostedService>();

        // Parity with Sql path: orphan probe resolves but no-ops when storage is InMemory (see DataConsistencyOrphanProbeExecutor).
        // IDbConnectionFactory stays UnsupportedRelationalDbConnectionFactory so DAST/ZAP containers need no SQL connection string.
        services.AddSingleton<IDbConnectionFactory, UnsupportedRelationalDbConnectionFactory>();
        services.AddSingleton<DataConsistencyOrphanProbeExecutor>();
        services.AddSingleton<IDataConsistencyOrphanProbeExecutor>(
            static sp => sp.GetRequiredService<DataConsistencyOrphanProbeExecutor>());
        services.AddSingleton<IArchLucidJob, OrphanProbeArchLucidJob>();

        if (!ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.OrphanProbe))

            services.AddHostedService<DataConsistencyOrphanProbeHostedService>();

    }
}
