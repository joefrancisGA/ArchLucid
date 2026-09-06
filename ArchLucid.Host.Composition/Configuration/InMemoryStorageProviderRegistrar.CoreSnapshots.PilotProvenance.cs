using ArchLucid.Application.Provenance;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Audit;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Repositories;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Repositories;
using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Contracts.Analytics;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Pilots;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Advisory.Learning;
using ArchLucid.Decisioning.Repositories;
using ArchLucid.KnowledgeGraph.Repositories;
using ArchLucid.Persistence.Analytics;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Conversation;
using ArchLucid.Persistence.Coordination.Evolution;
using ArchLucid.Persistence.Coordination.Export;
using ArchLucid.Persistence.Coordination.ProductLearning;
using ArchLucid.Persistence.Coordination.ProductLearning.Planning;
using ArchLucid.Persistence.Coordination.Projection;
using ArchLucid.Persistence.Coordination.Retrieval;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Orchestration;
using ArchLucid.Persistence.Pilots;
using ArchLucid.Persistence.Provenance;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Retrieval;
using ArchLucid.Persistence.Roi;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Transactions;
using ArchLucid.Persistence.Value;
using ArchLucid.Provenance;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class InMemoryStorageProviderRegistrar
{
    private static void RegisterPilotProvenance(IServiceCollection services)
    {
        services.AddSingleton<IContextSnapshotRepository>(static sp =>
            new InMemoryContextSnapshotRepository(sp.GetRequiredService<IScopeContextProvider>()));
        services.AddSingleton<IGraphSnapshotRepository>(static sp =>
            new InMemoryGraphSnapshotRepository(sp.GetRequiredService<IScopeContextProvider>()));
        services.AddSingleton<IGraphSnapshotSqlAuthorityWriter, GraphSnapshotSqlAuthorityWriterAdapter>();
        services.AddSingleton<ICosmosGraphSnapshotOutboxRepository, NoOpCosmosGraphSnapshotOutboxRepository>();
        services.AddSingleton<IGoldenManifestRepository, InMemoryGoldenManifestRepository>();
        services.AddSingleton<IArchitectureIdentityRepository>(static sp =>
            new InMemoryArchitectureIdentityRepository(
                sp.GetRequiredService<IDraftRequestRepository>(),
                sp.GetRequiredService<IRunRepository>()));
        services.AddSingleton<IArchitectureVersionRepository, InMemoryArchitectureVersionRepository>();
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
    }
}
