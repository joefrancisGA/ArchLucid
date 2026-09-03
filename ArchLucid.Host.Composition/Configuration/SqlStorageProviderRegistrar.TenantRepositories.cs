using ArchLucid.Application.Advisory;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Provenance;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Contracts.Analytics;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.AdminNotifications;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.AiProviders;
using ArchLucid.Core.Authority;
using ArchLucid.Core.AwsExtractor;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.GcpExtractor;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Feedback;
using ArchLucid.Core.GoToMarket;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.OperationalErrors;
using ArchLucid.Core.Admin;
using ArchLucid.Core.Search;
using ArchLucid.Core.Persistence.ApplicationPorts.Agents;
using ArchLucid.Core.Persistence.ApplicationPorts.Findings;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Persistence.ApplicationPorts.Interfaces;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Support;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Learning;
using ArchLucid.Decisioning.Advisory.Workflow;
using ArchLucid.Decisioning.Alerts;
using ArchLucid.Decisioning.Alerts.Composite;
using ArchLucid.Decisioning.Alerts.Delivery;
using ArchLucid.Decisioning.Governance.ComplianceDrift;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Host.Composition.Orchestration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.AdminNotifications;
using ArchLucid.Persistence.Advisory;
using ArchLucid.Persistence.Agents;
using ArchLucid.Persistence.Alerts;
using ArchLucid.Persistence.Analytics;
using ArchLucid.Persistence.ArchitectureIntelligence;
using ArchLucid.Persistence.Archival;
using ArchLucid.Persistence.AwsExtractor;
using ArchLucid.Persistence.AzureExtractor;
using ArchLucid.Persistence.GcpExtractor;
using ArchLucid.Persistence.Search;
using ArchLucid.Persistence.Support;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Conversation;
using ArchLucid.Persistence.Coordination.Compare;
using ArchLucid.Persistence.Coordination.Evolution;
using ArchLucid.Persistence.Coordination.ProductLearning;
using ArchLucid.Persistence.Coordination.ProductLearning.Planning;
using ArchLucid.Persistence.Coordination.Retrieval;
using ArchLucid.Persistence.Coordination.Export;
using ArchLucid.Persistence.Coordination.Projection;
using ArchLucid.Persistence.Retrieval;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.CustomerSuccess;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Diagnostics;
using ArchLucid.Persistence.Feedback;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.GoToMarket;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Governance.Posture;
using ArchLucid.Persistence.Identity;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Orchestration;
using ArchLucid.Persistence.Orchestration.RunStageOutcomes;
using ArchLucid.Persistence.Pilots;
using ArchLucid.Persistence.Roi;
using ArchLucid.Persistence.Provenance;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.OperationalErrors;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Value;
using ArchLucid.Provenance;

using Azure.Storage.Blobs;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class SqlStorageProviderRegistrar
{
    /// <summary>Product repositories scoped to tenant-plane connections (plus <see cref="DapperTenantRepository" /> directory routing).</summary>
    private static void RegisterTenantRepositories(IServiceCollection services, IConfiguration configuration)
    {
        SqlGraphAndContextSnapshotRegistrar.Register(services);
        SqlFindingsSnapshotRepositoryRegistrar.Register(services);
        ArchLucidStorageServiceCollectionExtensions.RegisterGoldenManifestRunAndPolicyPackRepositories(services, configuration);
        SqlAuthorityPipelineRepositoryRegistrar.Register(services, configuration);
        SqlOutboxRepositoryRegistrar.Register(services);
        services.AddScoped<IRetrievalGroundingTraceWriter, DapperRetrievalGroundingTraceWriter>();
        services.AddScoped<IRetrievalGroundingTraceReader, DapperRetrievalGroundingTraceReader>();
        RegisterProductLearning(services);
        RegisterEvolutionConversation(services);
        SqlPilotRepositoryRegistrar.Register(services);
        SqlMarketingRepositoryRegistrar.Register(services);
        SqlItsmRepositoryRegistrar.Register(services);
        SqlIdentityRepositoryRegistrar.Register(services);
        services.AddScoped<ITenantHostedExtractorConfigurationRepository, SqlTenantHostedExtractorConfigurationRepository>();
        services.AddScoped<ITenantAwsConnectionRepository, SqlTenantAwsConnectionRepository>();
        services.AddScoped<ITenantGcpConnectionRepository, SqlTenantGcpConnectionRepository>();
        services.AddScoped<IGlobalSearchRepository, SqlGlobalSearchRepository>();
        services.AddScoped<ITenantFirstValueReportBrandingRepository, SqlTenantFirstValueReportBrandingRepository>();
        services.AddScoped<IValueReportMetricsReader, DapperValueReportMetricsReader>();
        services.AddScoped<IRunPipelineAuditTimelineService, RunPipelineAuditTimelineService>();
        services.AddScoped<IProvenanceSnapshotRepository, SqlProvenanceSnapshotRepository>();
        services.AddScoped<IProvenanceGraphAccessService, ProvenanceGraphAccessService>();
        services.AddScoped<IProvenanceQueryService, ProvenanceQueryService>();
        services.AddScoped<IRecommendationRepository, DapperRecommendationRepository>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IRecommendationWorkflowService, RecommendationWorkflowService>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IRecommendationFeedbackAnalyzer, RecommendationFeedbackAnalyzer>();
        services.AddScoped<IRecommendationLearningProfileRepository, DapperRecommendationLearningProfileRepository>();
        services.AddSingleton<RecommendationLearningBuildGate>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IRecommendationLearningOperationalService, RecommendationLearningOperationalService>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IRecommendationLearningService, RecommendationLearningService>();
        services.AddScoped<ArchLucid.Decisioning.Advisory.Learning.IRecommendationLearningService>(sp => (ArchLucid.Decisioning.Advisory.Learning.IRecommendationLearningService)sp.GetRequiredService<ArchLucid.Core.Persistence.Ports.IRecommendationLearningService>());
        services.AddScoped<IAdvisoryScanScheduleRepository, DapperAdvisoryScanScheduleRepository>();
        services.AddScoped<IAdvisoryScanExecutionRepository, DapperAdvisoryScanExecutionRepository>();
        services.AddScoped<IArchitectureDigestRepository, DapperArchitectureDigestRepository>();
        services.AddScoped<IDigestSubscriptionRepository, DapperDigestSubscriptionRepository>();
        services.AddScoped<IDigestDeliveryAttemptRepository, DapperDigestDeliveryAttemptRepository>();
        services.AddScoped<IAlertRecordRepository, DapperAlertRecordRepository>();
        services.AddScoped<IAlertRoutingSubscriptionRepository, DapperAlertRoutingSubscriptionRepository>();
        services.AddScoped<IAlertDeliveryAttemptRepository, DapperAlertDeliveryAttemptRepository>();
        services.AddScoped<IPolicyPackAssignmentRepository, DapperPolicyPackAssignmentRepository>();
        services.AddScoped<IPolicyPackChangeLogRepository, DapperPolicyPackChangeLogRepository>();
        services.AddScoped<IComplianceDriftFindingsTrendReader, DapperComplianceDriftFindingsTrendReader>();
        ArchLucidStorageServiceCollectionExtensions.RegisterReferenceDataHotPathRepositories(services, configuration);
        services.AddScoped<IDataArchivalCoordinator, DataArchivalCoordinator>();
        services.AddScoped<IAgentTraceOrphanBlobCleanupService>(static sp => new AgentTraceOrphanBlobCleanupService(
            sp.GetRequiredService<IRunRepository>(),
            sp.GetRequiredService<IOptionsMonitor<ArtifactLargePayloadOptions>>(),
            sp.GetService<ITenantRegionalArtifactBlobClients>(),
            sp.GetService<BlobServiceClient>(),
            sp.GetRequiredService<ILogger<AgentTraceOrphanBlobCleanupService>>()));
        services.AddScoped<IArchitectureProjectRepository, DapperArchitectureProjectRepository>();
        services.AddScoped<IArchitectureProjectRetentionPurgeService, SqlArchitectureProjectRetentionPurgeService>();
        services.AddScoped<ISchemaVersionsJournalReader, DapperSchemaVersionsJournalReader>();
        services.AddScoped<IAdminNotificationsRepository, DapperAdminNotificationsRepository>();
        services.AddScoped<IRoiBulletinAggregateReader, SqlRoiBulletinAggregateReader>();
        services.AddScoped<ITenantCustomerSuccessRepository, SqlTenantCustomerSuccessRepository>();
        services.AddScoped<IOperatorStickinessSnapshotReader, SqlOperatorStickinessSnapshotReader>();
        services.AddScoped<IAdminTenantHealthReader, SqlAdminTenantHealthReader>();
        services.AddScoped<IFindingFeedbackRepository, SqlFindingFeedbackRepository>();
        services.AddScoped<IFindingReviewTrailRepository, SqlFindingReviewTrailRepository>();
        services.AddScoped<IRiskExceptionRepository, SqlRiskExceptionRepository>();
        services.AddScoped<IArchitectureReviewRecurrenceScheduleRepository, DapperArchitectureReviewRecurrenceScheduleRepository>();
        services.AddScoped<IArchitectureRiskRegisterQuery, ArchitectureRiskRegisterReader>();
        services.AddScoped<IArchitecturePostureReader, SqlArchitecturePostureReader>();
        services.AddScoped<IAgentToolInvocationRecordRepository, SqlAgentToolInvocationRecordRepository>();
        services.AddScoped<IArchitectureDecisionRegisterQuery, ArchitectureDecisionRegisterReader>();
        services.AddScoped<IImportedArchitectureRequestRepository, SqlImportedArchitectureRequestRepository>();
        services.AddScoped<IAzureExtractorPackageRepository, SqlAzureExtractorPackageRepository>();
        services.AddScoped<ICloudInventoryExtractorPackageRepository, SqlCloudInventoryExtractorPackageRepository>();
        services.AddScoped<ITenantNotificationChannelPreferencesRepository, DapperTenantNotificationChannelPreferencesRepository>();
        services.AddScoped<IOperatorSavedViewRepository, DapperOperatorSavedViewRepository>();
        services.AddScoped<ISupportProblemReportRepository, DapperSupportProblemReportRepository>();
        services.AddScoped<DapperDraftRequestRepository>();
        services.AddScoped<IDraftRequestRepository>(static sp => new CachingDraftRequestRepository(
            sp.GetRequiredService<DapperDraftRequestRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));
        services.AddScoped<ITenantTeamsIncomingWebhookConnectionRepository, DapperTenantTeamsIncomingWebhookConnectionRepository>();
        services.AddScoped<ITenantAzureOpenAiConnectionRepository, DapperTenantAzureOpenAiConnectionRepository>();
        services.AddScoped<ITenantExecDigestPreferencesRepository, DapperTenantExecDigestPreferencesRepository>();
        services.AddScoped<ITenantSponsorDigestPreferencesRepository, DapperTenantSponsorDigestPreferencesRepository>();
        services.AddScoped<ITenantHardPurgeService, SqlTenantHardPurgeService>();
        services.AddScoped<IPlatformAuditRepository, DapperPlatformAuditRepository>();
        services.AddScoped<IOperationalErrorRepository, DapperOperationalErrorRepository>();
        services.AddScoped<ITenantBlobPrefixDeletionService>(static sp => new TenantBlobPrefixDeletionService(
            sp.GetRequiredService<IOptionsMonitor<ArtifactLargePayloadOptions>>(),
            sp.GetService<ITenantRegionalArtifactBlobClients>(),
            sp.GetService<BlobServiceClient>()));
        services.AddScoped<ITenantDeletionService, TenantDeletionService>();
        services.AddScoped<ITenantErasureCommandService, TenantErasureCommandService>();
        services.AddScoped<ITenantSuspendCommandService, TenantSuspendCommandService>();
        services.AddScoped<IBillingLedger, SqlBillingLedger>();
        services.AddScoped<IUsageEventRepository, DapperUsageEventRepository>();
        services.AddScoped<ILlmTenantBudgetRepository, SqlLlmTenantBudgetRepository>();
        services.AddScoped<IAiUsageEventRepository, Persistence.AiUsage.SqlAiUsageEventRepository>();
        services.AddScoped<ILlmTenantWalletRepository, SqlLlmTenantWalletRepository>();
        services.AddScoped<IReferenceEvidenceRunLookup, SqlReferenceEvidenceRunLookup>();
        services.AddScoped<IArchitectureIntelligencePersistence, DapperArchitectureIntelligencePersistence>();
        services.AddArchitectureIntelligenceSqlPersistence();
    }
}
