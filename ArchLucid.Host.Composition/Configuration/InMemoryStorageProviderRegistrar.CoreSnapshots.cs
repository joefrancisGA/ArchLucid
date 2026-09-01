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
    private static void RegisterCoreSnapshots(IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<IContextSnapshotRepository>(static sp =>
            new InMemoryContextSnapshotRepository(sp.GetRequiredService<IScopeContextProvider>()));
        services.AddSingleton<IGraphSnapshotRepository>(static sp =>
            new InMemoryGraphSnapshotRepository(sp.GetRequiredService<IScopeContextProvider>()));
        services.AddSingleton<IGraphSnapshotSqlAuthorityWriter, GraphSnapshotSqlAuthorityWriterAdapter>();
        services.AddSingleton<ICosmosGraphSnapshotOutboxRepository, NoOpCosmosGraphSnapshotOutboxRepository>();
        services.AddSingleton<IGoldenManifestRepository, InMemoryGoldenManifestRepository>();
        services.AddSingleton<IArchitectureIdentityRepository, InMemoryArchitectureIdentityRepository>();
        services.AddSingleton<IArtifactBundleRepository, InMemoryArtifactBundleRepository>();
        services.AddSingleton<ITenantRepository, InMemoryTenantRepository>();
        services.AddSingleton<IArchitectureProjectRepository, InMemoryArchitectureProjectRepository>();
        services.AddSingleton<IArchitectureProjectRetentionPurgeService, NoOpArchitectureProjectRetentionPurgeService>();
        services.AddSingleton<IRunTelemetryRepository, InMemoryRunTelemetryRepository>();
        services.AddSingleton<IManifestFinalizationSqlRepository, InMemoryManifestFinalizationSqlRepository>();
        services.AddSingleton<IRunRepository>(sp =>
            new InMemoryRunRepository(sp.GetRequiredService<ITenantRepository>()));
        services.AddSingleton<RunRepositoryCommittedArchitectureReviewFlagReader>();
        services.AddSingleton<ICommittedArchitectureReviewFlagReader>(sp =>
            new CachingCommittedArchitectureReviewFlagReader(
                sp.GetRequiredService<RunRepositoryCommittedArchitectureReviewFlagReader>(),
                sp.GetRequiredService<IHotPathReadCache>()));
        services.AddSingleton<IAuthorityQueryService, InMemoryAuthorityQueryService>();
        services.AddSingleton<IArtifactQueryService, InMemoryArtifactQueryService>();
        services.AddScoped<IAuthorityCompareService, AuthorityCompareService>();
        services.AddScoped<IAuthorityReplayService, AuthorityReplayService>();
        services.AddSingleton<InMemoryAuditRepository>();
        services.AddSingleton<IAuditRepository>(sp => sp.GetRequiredService<InMemoryAuditRepository>());
        services.AddSingleton<IPilotScorecardMetricsReader, RunRepositoryPilotScorecardMetricsReader>();
        services.AddSingleton<IPilotReportCardMetricsReader, NullPilotReportCardMetricsReader>();
        services.AddSingleton<IPilotBaselineRepository, InMemoryPilotBaselineRepository>();
        services.AddSingleton<ITenantCostSettingsRepository, InMemoryTenantCostSettingsRepository>();
        services.AddSingleton<IPilotCloseoutRepository, InMemoryPilotCloseoutRepository>();
        services.AddSingleton<IValueReportMetricsReader, InMemoryValueReportMetricsReader>();
        services.AddScoped<IRunPipelineAuditTimelineService, RunPipelineAuditTimelineService>();
        services.AddSingleton<IProvenanceSnapshotRepository, InMemoryProvenanceSnapshotRepository>();
        services.AddScoped<IProvenanceGraphAccessService, ProvenanceGraphAccessService>();
        services.AddScoped<IProvenanceQueryService, ProvenanceQueryService>();
        services.AddSingleton<IArchLucidUnitOfWorkFactory, InMemoryArchLucidUnitOfWorkFactory>();
        services.AddSingleton<IDistributedCreateRunIdempotencyLock, InProcessCreateRunIdempotencyLock>();
        services.AddSingleton<IRetrievalIndexingOutboxRepository, InMemoryRetrievalIndexingOutboxRepository>();
        services.AddSingleton<IRunExportBlobPushOutboxRepository, InMemoryRunExportBlobPushOutboxRepository>();
        services.AddSingleton<IPostCommitProjectionOutboxRepository, InMemoryPostCommitProjectionOutboxRepository>();
        services.AddSingleton<InMemoryRetrievalGroundingTraceWriter>();
        services.AddSingleton<IRetrievalGroundingTraceWriter>(sp => sp.GetRequiredService<InMemoryRetrievalGroundingTraceWriter>());
        services.AddSingleton<IRetrievalGroundingTraceReader>(sp => sp.GetRequiredService<InMemoryRetrievalGroundingTraceWriter>());
        services.AddSingleton<IIntegrationEventOutboxRepository, InMemoryIntegrationEventOutboxRepository>();
        services.AddSingleton<IProductLearningPilotSignalRepository, InMemoryProductLearningPilotSignalRepository>();
        services.AddSingleton<IProductLearningPlanningRepository, InMemoryProductLearningPlanningRepository>();
        services.AddSingleton<IProductLearningFeedbackAggregationService, ProductLearningFeedbackAggregationService>();
        services.AddSingleton<IProductLearningImprovementOpportunityService, ProductLearningImprovementOpportunityService>();
        services.AddSingleton<IProductLearningDashboardService, ProductLearningDashboardService>();
        services.AddScoped<IProductLearningPlanningDerivationService, ProductLearningPlanningDerivationService>();
        services.AddSingleton<IPatternInsightAggregateRepository, InMemoryPatternInsightAggregateRepository>();
        services.AddSingleton<IEvolutionCandidateChangeSetRepository, InMemoryEvolutionCandidateChangeSetRepository>();
        services.AddSingleton<IEvolutionSimulationRunRepository, InMemoryEvolutionSimulationRunRepository>();
        services.AddSingleton<IConversationThreadRepository, InMemoryConversationThreadRepository>();
        services.AddSingleton<IConversationMessageRepository, InMemoryConversationMessageRepository>();
        services.AddSingleton<IAuthorityPipelineWorkRepository, InMemoryAuthorityPipelineWorkRepository>();
        services.AddSingleton<IAsyncAuthorityPipelineModeResolver, DisabledAsyncAuthorityPipelineModeResolver>();
        services.AddSingleton<IRunStageOutcomesRepository, InMemoryRunStageOutcomesRepository>();
        services.AddScoped<IAuthorityPipelineStagesExecutor, AuthorityPipelineStagesExecutor>();
        services.AddScoped<IAuthorityCommittedPipelineFinalizer, AuthorityCommittedPipelineFinalizer>();
        services.AddScoped<IAuthorityPipelineStagesExecutionDriver, InlineAuthorityPipelineStagesExecutionDriver>();
        services.AddSingleton<ITenantAuthorityPipelineConcurrencyGate, InMemoryTenantAuthorityPipelineConcurrencyGate>();
        services.AddScoped<AuthorityRunOrchestrator>();
        services.AddScoped<IAuthorityRunOrchestrator, AuthorityRunOrchestrator>();
        services.AddScoped<IDataArchivalCoordinator, DataArchivalCoordinator>();
        services.AddScoped<IAgentTraceOrphanBlobCleanupService>(static sp => new AgentTraceOrphanBlobCleanupService(
            sp.GetRequiredService<IRunRepository>(),
            sp.GetRequiredService<IOptionsMonitor<ArtifactLargePayloadOptions>>(),
            sp.GetService<ITenantRegionalArtifactBlobClients>(),
            sp.GetService<BlobServiceClient>(),
            sp.GetRequiredService<ILogger<AgentTraceOrphanBlobCleanupService>>()));
    }
}
