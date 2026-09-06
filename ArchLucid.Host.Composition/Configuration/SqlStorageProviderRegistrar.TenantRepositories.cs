using ArchLucid.Application.Advisory;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Admin;
using ArchLucid.Core.AdminNotifications;
using ArchLucid.Core.AiProviders;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Feedback;
using ArchLucid.Core.GoToMarket;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.OperationalErrors;
using ArchLucid.Core.Persistence.ApplicationPorts.Agents;
using ArchLucid.Core.Persistence.ApplicationPorts.Findings;
using ArchLucid.Core.Persistence.ApplicationPorts.Interfaces;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Support;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Advisory.Learning;
using ArchLucid.Host.Composition.Orchestration;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.AdminNotifications;
using ArchLucid.Persistence.Advisory;
using ArchLucid.Persistence.Agents;
using ArchLucid.Persistence.ArchitectureIntelligence;
using ArchLucid.Persistence.Archival;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.CustomerSuccess;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Diagnostics;
using ArchLucid.Persistence.Feedback;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.GoToMarket;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Governance.Posture;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Orchestration;
using ArchLucid.Persistence.OperationalErrors;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Retrieval;
using ArchLucid.Persistence.Roi;
using ArchLucid.Persistence.Support;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Value;
using ArchLucid.Provenance;

using Azure.Storage.Blobs;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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
        RegisterTenantRepositoriesExtractorsProvenance(services);
        services.AddScoped<IValueReportMetricsReader, DapperValueReportMetricsReader>();
        services.AddScoped<IRunPipelineAuditTimelineService, RunPipelineAuditTimelineService>();
        services.AddScoped<IRecommendationRepository, DapperRecommendationRepository>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IRecommendationWorkflowService, RecommendationWorkflowService>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IRecommendationFeedbackAnalyzer, RecommendationFeedbackAnalyzer>();
        services.AddScoped<IRecommendationLearningProfileRepository, DapperRecommendationLearningProfileRepository>();
        services.AddSingleton<RecommendationLearningBuildGate>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IRecommendationLearningOperationalService, RecommendationLearningOperationalService>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IRecommendationLearningService, RecommendationLearningService>();
        services.AddScoped<ArchLucid.Decisioning.Advisory.Learning.IRecommendationLearningService>(sp => (ArchLucid.Decisioning.Advisory.Learning.IRecommendationLearningService)sp.GetRequiredService<ArchLucid.Core.Persistence.Ports.IRecommendationLearningService>());
        RegisterTenantRepositoriesAlertsDigests(services);
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
        services.AddScoped<IFindingDispositionConcurrencyRepository, SqlFindingDispositionConcurrencyRepository>();
        services.AddScoped<IRiskExceptionRepository, SqlRiskExceptionRepository>();
        services.AddScoped<IArchitectureReviewRecurrenceScheduleRepository, DapperArchitectureReviewRecurrenceScheduleRepository>();
        services.AddScoped<IArchitectureRiskRegisterQuery, ArchitectureRiskRegisterReader>();
        services.AddScoped<IArchitecturePostureReader, SqlArchitecturePostureReader>();
        services.AddScoped<IAgentToolInvocationRecordRepository, SqlAgentToolInvocationRecordRepository>();
        services.AddScoped<IArchitectureDecisionRegisterQuery, ArchitectureDecisionRegisterReader>();
        services.AddScoped<IImportedArchitectureRequestRepository, SqlImportedArchitectureRequestRepository>();
        services.AddScoped<ITenantNotificationChannelPreferencesRepository, DapperTenantNotificationChannelPreferencesRepository>();
        services.AddScoped<IOperatorSavedViewRepository, DapperOperatorSavedViewRepository>();
        services.AddScoped<ISupportProblemReportRepository, DapperSupportProblemReportRepository>();
        services.AddScoped<DapperDraftRequestRepository>();
        services.AddScoped<IDraftRequestRepository>(static sp => new CachingDraftRequestRepository(
            sp.GetRequiredService<DapperDraftRequestRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));
        services.AddScoped<ITenantTeamsIncomingWebhookConnectionRepository, DapperTenantTeamsIncomingWebhookConnectionRepository>();
        services.AddScoped<ITenantAzureOpenAiConnectionRepository, DapperTenantAzureOpenAiConnectionRepository>();
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
        RegisterTenantRepositoriesBillingWallet(services);
        services.AddScoped<IReferenceEvidenceRunLookup, SqlReferenceEvidenceRunLookup>();
        services.AddScoped<IArchitectureIntelligencePersistence, DapperArchitectureIntelligencePersistence>();
        services.AddArchitectureIntelligenceSqlPersistence();
    }
}
