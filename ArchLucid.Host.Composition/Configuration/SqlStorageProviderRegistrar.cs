using ArchLucid.Application.Advisory;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Application.Provenance;
using ArchLucid.Application.Tenancy;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Contracts.Analytics;
using ArchLucid.Core.AdminNotifications;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Authority;
using ArchLucid.Core.AwsExtractor;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.GcpExtractor;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Feedback;
using ArchLucid.Core.GoToMarket;
using ArchLucid.Core.Marketing;
using ArchLucid.Core.Admin;
using ArchLucid.Core.AiProviders;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Search;
using ArchLucid.Core.Persistence.ApplicationPorts.Agents;
using ArchLucid.Core.Persistence.ApplicationPorts.Findings;
using ArchLucid.Core.Persistence.ApplicationPorts.FineTuning;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Pilots;
using ArchLucid.Persistence.Agents;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Retrieval;
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
using ArchLucid.Host.Core.Audit;
using ArchLucid.Host.Core.Authority;
using ArchLucid.Host.Composition.Orchestration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.AdminNotifications;
using ArchLucid.Persistence.Advisory;
using ArchLucid.Persistence.Alerts;
using ArchLucid.Persistence.Analytics;
using ArchLucid.Persistence.ArchitectureIntelligence;
using ArchLucid.Persistence.Archival;
using ArchLucid.Persistence.Authorization;
using ArchLucid.Persistence.AzureExtractor;
using ArchLucid.Persistence.AwsExtractor;
using ArchLucid.Persistence.GcpExtractor;
using ArchLucid.Persistence.Search;
using ArchLucid.Persistence.Support;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Concurrency;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Conversation;
using ArchLucid.Persistence.Coordination.Caching;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Coordination.Compare;
using ArchLucid.Persistence.Coordination.Evolution;
using ArchLucid.Persistence.Coordination.ProductLearning;
using ArchLucid.Persistence.Coordination.ProductLearning.Planning;
using ArchLucid.Persistence.Coordination.Replay;
using ArchLucid.Persistence.Coordination.Retrieval;
using ArchLucid.Persistence.Coordination.Export;
using ArchLucid.Persistence.Coordination.Projection;
using ArchLucid.Persistence.Retrieval;
using ArchLucid.Persistence.CustomerSuccess;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Core.Persistence.ApplicationPorts.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Diagnostics;
using ArchLucid.Persistence.Feedback;
using ArchLucid.Persistence.FineTuning;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.GoToMarket;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Governance.Posture;
using ArchLucid.Persistence.Identity;
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
using ArchLucid.Persistence.Scim;
using ArchLucid.Persistence.Sql;
using ArchLucid.Persistence.Telemetry;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Tenancy.Diagnostics;
using ArchLucid.Persistence.Transactions;
using ArchLucid.Persistence.Value;
using ArchLucid.Provenance;

using Azure.Storage.Blobs;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed class SqlStorageProviderRegistrar : IStorageProviderRegistrar
{
    public void Register(IServiceCollection services, IConfiguration configuration)
    {
        DapperGlobalCommandTimeoutBootstrap.ApplyIfConfigured(configuration);

        StructuralExecutionModeTypeHandler.Register();

        bool enforceServerCertificateTrust =
            ArchLucidConfigurationBridge.ShouldEnforceSqlServerCertificateTrust(configuration);

        services.Configure<WarmTenantCatalogOptions>(configuration.GetSection(WarmTenantCatalogOptions.SectionPath));
        services.Configure<SqlConnectionPoolOptions>(configuration.GetSection(SqlConnectionPoolOptions.SectionPath));

        SqlConnectionPoolOptions poolSnapshot =
            configuration.GetSection(SqlConnectionPoolOptions.SectionPath).Get<SqlConnectionPoolOptions>()
            ?? new SqlConnectionPoolOptions();

        string connectionString = SqlConnectionStringPoolNormalizer.Apply(
            ArchLucidConfigurationBridge.ResolveSqlConnectionString(
                                      configuration,
                                      enforceServerCertificateTrust)
                                  ?? throw new InvalidOperationException(
                                      "ConnectionStrings:ArchLucid is missing or blank. "
                                      + "Set ConnectionStrings:ArchLucid in appsettings or the ConnectionStrings__ArchLucid "
                                      + "environment variable to a valid SQL Server connection string before starting the host "
                                      + "(not required when ArchLucid:StorageProvider is InMemory)."),
            poolSnapshot);

        services.Configure<SqlServerOptions>(configuration.GetSection(SqlServerOptions.SectionName));
        services.Configure<SqlTopologyOptions>(configuration.GetSection(SqlTopologyOptions.SectionPath));

        ArchLucidStorageServiceCollectionExtensions.RegisterArtifactLargePayloadBlobStore(services, configuration);
        ArchLucidStorageServiceCollectionExtensions.RegisterHotPathReadCaching(services, configuration);
        ArchLucidStorageServiceCollectionExtensions.RegisterSharedDistributedCacheAndLlmCompletion(services, configuration);

        services.TryAddSingleton<IMemoryCache>(_ => new MemoryCache(new MemoryCacheOptions()));

        string? systemConnectionString = ArchLucidConfigurationBridge.ResolveSqlSystemConnectionString(
            configuration,
            enforceServerCertificateTrust);
        SqlTopologyOptions topologySnapshot =
            configuration.GetSection(SqlTopologyOptions.SectionPath).Get<SqlTopologyOptions>() ?? new SqlTopologyOptions();
        string effectiveSystemConnectionString = topologySnapshot.Mode == SqlTopologyMode.SystemWithPerTenantCatalogs
            ? (systemConnectionString ?? throw new InvalidOperationException(
                "ConnectionStrings:ArchLucidSystem is required when ArchLucid:SqlTopology:Mode is SystemWithPerTenantCatalogs."))
            : connectionString;

        RegisterSystemRuntimeInfrastructure(
            services,
            connectionString,
            effectiveSystemConnectionString,
            enforceServerCertificateTrust);

        string scriptPath = ResolveArchLucidSqlScriptPath();

        string schemaBootstrapConnectionString = ResolveTenantSchemaBootstrapConnectionString(
            topologySnapshot,
            connectionString);

        RegisterTenantRuntimeInfrastructure(
            services,
            connectionString,
            schemaBootstrapConnectionString,
            scriptPath,
            enforceServerCertificateTrust);
        RegisterTenantRepositories(services, configuration);

        RegisterSqlOperationalSingletons(services, configuration, connectionString);
    }

    /// <summary>Control-plane SQL: system catalog factory, bindings, resolver, provisioning orchestration.</summary>
    private static void RegisterSystemRuntimeInfrastructure(
        IServiceCollection services,
        string connectionString,
        string effectiveSystemConnectionString,
        bool enforceServerCertificateTrust)
    {
        SqlSystemRuntimeInfrastructureRegistrar.Register(
            services,
            connectionString,
            effectiveSystemConnectionString,
            enforceServerCertificateTrust);
    }

    /// <summary>
    ///     Elevated tenant catalog connection for DDL bootstrap; mirrors DbUp bootstrap resolution in persistence startup.
    /// </summary>
    private static string ResolveTenantSchemaBootstrapConnectionString(
        SqlTopologyOptions topology,
        string runtimeConnectionString)
    {
        if (!string.IsNullOrWhiteSpace(topology.DevelopmentTenantBootstrapConnectionString))
            return topology.DevelopmentTenantBootstrapConnectionString;

        if (!string.IsNullOrWhiteSpace(topology.DevelopmentTenantConnectionString))
            return topology.DevelopmentTenantConnectionString;

        return runtimeConnectionString;
    }

    /// <summary>Tenant-plane SQL stack: routing, resilience, read replicas, bootstrapper.</summary>
    private static void RegisterTenantRuntimeInfrastructure(
        IServiceCollection services,
        string connectionString,
        string schemaBootstrapConnectionString,
        string scriptPath,
        bool enforceServerCertificateTrust)
    {
        SqlTenantRuntimeInfrastructureRegistrar.Register(
            services,
            connectionString,
            schemaBootstrapConnectionString,
            scriptPath,
            enforceServerCertificateTrust);
    }

    private static string ResolveArchLucidSqlScriptPath()
    {
        return PersistenceScriptPaths.ResolveTenantScriptPath();
    }

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
        services.AddScoped<IProductLearningPilotSignalRepository, DapperProductLearningPilotSignalRepository>();
        services.AddScoped<IProductLearningPlanningRepository, DapperProductLearningPlanningRepository>();
        services.AddScoped<IProductLearningFeedbackAggregationService, ProductLearningFeedbackAggregationService>();
        services.AddScoped<IProductLearningImprovementOpportunityService, ProductLearningImprovementOpportunityService>();
        services.AddScoped<IProductLearningDashboardService, ProductLearningDashboardService>();
        services.AddScoped<IProductLearningPlanningDerivationService, ProductLearningPlanningDerivationService>();
        services.AddScoped<IPatternInsightAggregateRepository, DapperPatternInsightAggregateRepository>();
        services.AddScoped<IEvolutionCandidateChangeSetRepository, DapperEvolutionCandidateChangeSetRepository>();
        services.AddScoped<IEvolutionSimulationRunRepository, DapperEvolutionSimulationRunRepository>();
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
        services.AddScoped<IConversationThreadRepository, DapperConversationThreadRepository>();
        services.AddScoped<IConversationMessageRepository, DapperConversationMessageRepository>();
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

    private static void RegisterSqlOperationalSingletons(
        IServiceCollection services,
        IConfiguration configuration,
        string connectionString)
    {
        SqlOperationalSingletonsRegistrar.Register(services, configuration, connectionString);
        RegisterDtfOrchestrationInfrastructure(services, configuration, connectionString);
    }

    /// <summary>
    ///     Registers Durable Task Framework worker and client when Durable Task orchestration is enabled.
    /// </summary>
    private static void RegisterDtfOrchestrationInfrastructure(
        IServiceCollection services,
        IConfiguration configuration,
        string connectionString)
    {
        SqlDtfOrchestrationInfrastructureRegistrar.Register(services, configuration, connectionString);
    }
}
