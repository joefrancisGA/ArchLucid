using System.Reflection;

using Polly;
using ArchLucid.Application.Advisory;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Analytics;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Core.AdminNotifications;
using ArchLucid.Core.Authority;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Feedback;
using ArchLucid.Core.GoToMarket;
using ArchLucid.Core.Marketing;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Search;
using ArchLucid.Core.Pilots;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
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
using ArchLucid.Host.Core.Authority;
using ArchLucid.Host.Composition.Orchestration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.DataAccess;
using ArchLucid.Host.Core.DataConsistency;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.AdminNotifications;
using ArchLucid.Persistence.Advisory;
using ArchLucid.Persistence.Alerts;
using ArchLucid.Persistence.Analytics;
using ArchLucid.Persistence.Archival;
using ArchLucid.Persistence.Authorization;
using ArchLucid.Persistence.AzureExtractor;
using ArchLucid.Persistence.Search;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Concurrency;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Conversation;
using ArchLucid.Persistence.Coordination.Compare;
using ArchLucid.Persistence.Coordination.Diagnostics;
using ArchLucid.Persistence.Coordination.Evolution;
using ArchLucid.Persistence.Coordination.ProductLearning;
using ArchLucid.Persistence.Coordination.ProductLearning.Planning;
using ArchLucid.Persistence.Coordination.Replay;
using ArchLucid.Persistence.Coordination.Retrieval;
using ArchLucid.Persistence.Retrieval;
using ArchLucid.Persistence.CustomerSuccess;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Feedback;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.GoToMarket;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Identity;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Marketing;
using ArchLucid.Persistence.Orchestration;
using ArchLucid.Persistence.Orchestration.Pipeline;
using ArchLucid.Persistence.Pilots;
using ArchLucid.Persistence.Roi;
using ArchLucid.Application.Provenance;
using ArchLucid.Persistence.Provenance;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Scim;
using ArchLucid.Persistence.Sql;
using ArchLucid.Persistence.Telemetry;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Tenancy.Diagnostics;
using ArchLucid.Persistence.Transactions;
using ArchLucid.Persistence.Value;
using ArchLucid.Persistence.WeeklyDigest;
using ArchLucid.Provenance;

using Azure.Storage.Blobs;

using Microsoft.DurableTask;
using Microsoft.DurableTask.Client;
using Microsoft.DurableTask.Worker;
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

        string connectionString = ArchLucidConfigurationBridge.ResolveSqlConnectionString(
                                      configuration,
                                      enforceServerCertificateTrust)
                                  ?? throw new InvalidOperationException(
                                      "Missing connection string 'ArchLucid'.");

        services.Configure<SqlServerOptions>(configuration.GetSection(SqlServerOptions.SectionName));
        services.Configure<SqlTopologyOptions>(configuration.GetSection(SqlTopologyOptions.SectionPath));
        services.Configure<WarmTenantCatalogOptions>(configuration.GetSection(WarmTenantCatalogOptions.SectionPath));

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

        RegisterTenantRuntimeInfrastructure(
            services,
            connectionString,
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
        services.AddSingleton<ISystemSqlConnectionFactory>(sp =>
        {
            SqlOpenResilienceOptions sqlOpenOpts = sp.GetRequiredService<IOptions<SqlOpenResilienceOptions>>().Value;
            ResiliencePipeline pipeline = SqlOpenResilienceDefaults.BuildSqlOpenRetryPipeline(
                sp.GetRequiredService<ILogger<DedicatedSystemSqlConnectionFactory>>(),
                sqlOpenOpts.MaxRetryAttempts,
                TimeSpan.FromMilliseconds(sqlOpenOpts.BaseDelayMilliseconds));

            return new DedicatedSystemSqlConnectionFactory(
                effectiveSystemConnectionString,
                pipeline,
                enforceServerCertificateTrust);
        });

        services.AddScoped<ITenantDatabaseBindingRepository, DapperTenantDatabaseBindingRepository>();
        services.AddScoped<IWarmTenantCatalogStandbyRepository, DapperWarmTenantCatalogStandbyRepository>();
        services.AddScoped<IWarmTenantCatalogReplenishService, WarmTenantCatalogReplenishService>();
        services.AddScoped<ITenantDatabaseResolver>(sp =>
            new TenantDatabaseResolver(
                sp.GetRequiredService<ITenantDatabaseBindingRepository>(),
                sp.GetRequiredService<IMemoryCache>(),
                sp.GetRequiredService<IOptionsMonitor<SqlTopologyOptions>>(),
                sp.GetRequiredService<IOptionsMonitor<ArchLucidPersistenceOptions>>(),
                connectionString,
                enforceServerCertificateTrust));

        services.AddScoped<ITenantSqlCatalogProvisioner, SqlTenantSqlCatalogProvisioner>();
    }

    /// <summary>Tenant-plane SQL stack: routing, resilience, read replicas, bootstrapper.</summary>
    private static void RegisterTenantRuntimeInfrastructure(
        IServiceCollection services,
        string connectionString,
        string scriptPath,
        bool enforceServerCertificateTrust)
    {
        services.AddSingleton<SqlConnectionFactory>(
            _ => new SqlConnectionFactory(connectionString, enforceServerCertificateTrust));

        RegisterBackgroundWorkerSqlResilience(services);

        services.AddScoped<IWeeklyArchitectureCriticalFindingSummaryRepository,
            DapperWeeklyArchitectureCriticalFindingSummaryRepository>();

        services.AddScoped<ScopedRoutingSqlConnectionFactory>(sp =>
            new ScopedRoutingSqlConnectionFactory(
                connectionString,
                sp.GetRequiredService<ISystemSqlConnectionFactory>(),
                sp.GetRequiredService<ITenantDatabaseResolver>(),
                sp.GetRequiredService<IScopeContextProvider>(),
                sp.GetRequiredService<IOptionsMonitor<SqlTopologyOptions>>(),
                enforceServerCertificateTrust));

        services.AddScoped<IInternalCrossTenantMetricsCollector, SqlInternalCrossTenantMetricsCollector>();
        services.AddScoped<IInternalCrossTenantRollupRepository, SqlInternalCrossTenantRollupRepository>();
        services.AddScoped<InternalCrossTenantRollupProcessor>();
        services.AddScoped<IInternalCrossTenantAnalyticsService, SqlInternalCrossTenantAnalyticsService>();

        services.AddScoped<ResilientSqlConnectionFactory>(sp =>
        {
            SqlOpenResilienceOptions sqlOpenOpts = sp.GetRequiredService<IOptions<SqlOpenResilienceOptions>>().Value;
            SqlConnectionOpenAttemptTiming openTiming = new();

            ResiliencePipeline pipeline = SqlOpenResilienceDefaults.BuildSqlOpenRetryPipeline(
                sp.GetRequiredService<ILogger<ResilientSqlConnectionFactory>>(),
                sqlOpenOpts.MaxRetryAttempts,
                TimeSpan.FromMilliseconds(sqlOpenOpts.BaseDelayMilliseconds),
                () => openTiming.ElapsedMilliseconds);

            return new ResilientSqlConnectionFactory(
                sp.GetRequiredService<ScopedRoutingSqlConnectionFactory>(),
                pipeline,
                openTiming);
        });

        services.AddScoped<ISqlConnectionFactory>(static sp =>
            sp.GetRequiredService<ResilientSqlConnectionFactory>());

        services.AddScoped<IReadOnlyDbConnectionFactory>(sp => new ReadOnlyDbConnectionFactory(
            sp.GetRequiredService<ResilientSqlConnectionFactory>(),
            sp.GetRequiredService<ITenantDatabaseResolver>(),
            sp.GetRequiredService<IScopeContextProvider>(),
            sp.GetRequiredService<IOptionsMonitor<ArchLucidPersistenceOptions>>(),
            sp.GetRequiredService<IOptionsMonitor<SqlTopologyOptions>>(),
            sp.GetRequiredService<IOptions<SqlOpenResilienceOptions>>(),
            sp.GetRequiredService<ILogger<ReadOnlyDbConnectionFactory>>(),
            enforceServerCertificateTrust));

        services.AddScoped<ITenantSqlConnectionFactory>(sp =>
            new DelegatingTenantSqlConnectionFactory(sp.GetRequiredService<ISqlConnectionFactory>()));

        services.AddScoped<IAuthorityRunListConnectionFactory>(sp => new ReadReplicaRoutedConnectionFactory(
            sp.GetRequiredService<ResilientSqlConnectionFactory>(),
            sp.GetRequiredService<IOptionsMonitor<SqlServerOptions>>(),
            ReadReplicaQueryRoute.AuthorityRunList,
            sp.GetRequiredService<IOptions<SqlOpenResilienceOptions>>(),
            sp.GetRequiredService<ILogger<ReadReplicaRoutedConnectionFactory>>()));

        services.AddScoped<IGovernanceResolutionReadConnectionFactory>(sp => new ReadReplicaRoutedConnectionFactory(
            sp.GetRequiredService<ResilientSqlConnectionFactory>(),
            sp.GetRequiredService<IOptionsMonitor<SqlServerOptions>>(),
            ReadReplicaQueryRoute.GovernanceResolution,
            sp.GetRequiredService<IOptions<SqlOpenResilienceOptions>>(),
            sp.GetRequiredService<ILogger<ReadReplicaRoutedConnectionFactory>>()));

        services.AddScoped<IGoldenManifestLookupReadConnectionFactory>(sp => new ReadReplicaRoutedConnectionFactory(
            sp.GetRequiredService<ResilientSqlConnectionFactory>(),
            sp.GetRequiredService<IOptionsMonitor<SqlServerOptions>>(),
            ReadReplicaQueryRoute.GoldenManifestLookup,
            sp.GetRequiredService<IOptions<SqlOpenResilienceOptions>>(),
            sp.GetRequiredService<ILogger<ReadReplicaRoutedConnectionFactory>>()));

        services.AddScoped<ISchemaBootstrapper>(sp =>
            new SqlSchemaBootstrapper(
                sp.GetRequiredService<ISqlConnectionFactory>(),
                scriptPath));
    }

    private static string ResolveArchLucidSqlScriptPath()
    {
        Assembly persistenceAssembly = typeof(SqlSchemaBootstrapper).Assembly;
        string dir = Path.GetDirectoryName(persistenceAssembly.Location) ?? AppContext.BaseDirectory;

        return Path.Combine(dir, "Scripts", "ArchLucid.sql");
    }

    /// <summary>Product repositories scoped to tenant-plane connections (plus <see cref="DapperTenantRepository" /> directory routing).</summary>
    private static void RegisterTenantRepositories(IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IManifestFinalizationSqlRepository, SqlManifestFinalizationRepository>();
        services.AddScoped<IRunTelemetryRepository, SqlRunTelemetryRepository>();
        services.AddScoped<IContextSnapshotRepository, SqlContextSnapshotRepository>();
        services.AddScoped<IGraphSnapshotRepository, SqlGraphSnapshotRepository>();
        services.AddScoped<IFindingsSnapshotRepository, SqlFindingsSnapshotRepository>();
        services.AddScoped<IFindingInspectReadRepository, DapperFindingInspectReadRepository>();
        services.AddScoped<IFindingRecordMuteRepository, DapperFindingRecordMuteRepository>();
        services.AddScoped<IDecisionTraceRepository, SqlDecisionTraceRepository>();
        ArchLucidStorageServiceCollectionExtensions.RegisterGoldenManifestRunAndPolicyPackRepositories(services, configuration);

        services.AddScoped<IArtifactBundleRepository, SqlArtifactBundleRepository>();
        services.AddScoped<IAuthorityQueryService, DapperAuthorityQueryService>();
        services.AddScoped<IArtifactQueryService, DapperArtifactQueryService>();
        services.AddScoped<IAuthorityCompareService, AuthorityCompareService>();
        services.AddScoped<IAuthorityReplayService, AuthorityReplayService>();
        services.AddScoped<IArchLucidUnitOfWorkFactory, DapperArchLucidUnitOfWorkFactory>();
        services.AddScoped<IDistributedCreateRunIdempotencyLock, SqlSessionDistributedCreateRunIdempotencyLock>();
        services.AddScoped<IRetrievalIndexingOutboxRepository, DapperRetrievalIndexingOutboxRepository>();
        services.AddScoped<IRetrievalGroundingTraceWriter, DapperRetrievalGroundingTraceWriter>();
        services.AddScoped<IIntegrationEventOutboxRepository, DapperIntegrationEventOutboxRepository>();
        services.AddScoped<IProductLearningPilotSignalRepository, DapperProductLearningPilotSignalRepository>();
        services.AddScoped<IProductLearningPlanningRepository, DapperProductLearningPlanningRepository>();
        services.AddScoped<IProductLearningFeedbackAggregationService, ProductLearningFeedbackAggregationService>();
        services.AddScoped<IProductLearningImprovementOpportunityService, ProductLearningImprovementOpportunityService>();
        services.AddScoped<IProductLearningDashboardService, ProductLearningDashboardService>();
        services.AddScoped<IProductLearningPlanningDerivationService, ProductLearningPlanningDerivationService>();
        services.AddScoped<IEvolutionCandidateChangeSetRepository, DapperEvolutionCandidateChangeSetRepository>();
        services.AddScoped<IEvolutionSimulationRunRepository, DapperEvolutionSimulationRunRepository>();
        services.AddScoped<IAuthorityPipelineWorkRepository, DapperAuthorityPipelineWorkRepository>();
        services.AddScoped<IAsyncAuthorityPipelineModeResolver, FeatureManagementAuthorityPipelineModeResolver>();
        services.AddScoped<IAuthorityPipelineStagesExecutor, AuthorityPipelineStagesExecutor>();
        services.AddScoped<IAuthorityCommittedPipelineFinalizer, AuthorityCommittedPipelineFinalizer>();
        services.AddScoped<IAuthorityPipelineStagesExecutionDriver, InlineAuthorityPipelineStagesExecutionDriver>();
        services.AddScoped<SqlAuthorityPipelineTenantExecutionLeaseRepository>();
        services.AddScoped<ITenantAuthorityPipelineConcurrencyGate, SqlTenantAuthorityPipelineConcurrencyGate>();
        // Legacy AuthorityRunOrchestrator retained in ArchLucid.Persistence for ArchLucid.Persistence.Tests;
        // not registered as IAuthorityRunOrchestrator in production DI since DTF parity confirmed — SQL host uses Durable Task port.
        services.AddScoped<AuthorityRunOrchestrator>();
        services.AddScoped<IAuthorityRunOrchestrator, DtfAuthorityRunOrchestrator>();
        services.AddScoped<IAuditSqlRetryPolicyProvider, AuditSqlRetryPolicyProvider>();
        services.AddScoped<IAuditRepository, DapperAuditRepository>();
        services.AddScoped<IPilotScorecardMetricsReader, DapperPilotScorecardMetricsReader>();
        services.AddScoped<IPilotReportCardMetricsReader, DapperPilotReportCardMetricsReader>();
        services.AddScoped<IPilotBaselineRepository, DapperPilotBaselineRepository>();
        services.AddScoped<ITenantCostSettingsRepository, DapperTenantCostSettingsRepository>();
        services.AddScoped<IPilotCloseoutRepository, DapperPilotCloseoutRepository>();
        services.AddScoped<IMarketingPricingQuoteRequestRepository, SqlMarketingPricingQuoteRequestRepository>();
        services.AddScoped<IMarketingPricingQuoteRequestAgingReader, SqlMarketingPricingQuoteRequestAgingReader>();
        services.AddScoped<IMarketingEarlyAccessRequestRepository, SqlMarketingEarlyAccessRequestRepository>();
        services.AddScoped<ITenantMarketingAttributionRepository, SqlTenantMarketingAttributionRepository>();
        services.AddScoped<IFirstTenantFunnelEventStore, SqlFirstTenantFunnelEventStore>();
        services.AddScoped<IFirstTenantFunnelArchivalBatchStore, SqlFirstTenantFunnelArchivalBatchStore>();
        services.AddScoped<IItsmFindingCorrelationRepository, SqlItsmFindingCorrelationRepository>();
        services.AddScoped<ITenantItsmOutboundSettingsRepository, SqlTenantItsmOutboundSettingsRepository>();
        services.AddScoped<ITenantSettingsRepository, SqlTenantSettingsRepository>();
        services.AddScoped<ITenantIdentityProviderConfigurationRepository, SqlTenantIdentityProviderConfigurationRepository>();
        services.AddScoped<ITenantHostedExtractorConfigurationRepository, SqlTenantHostedExtractorConfigurationRepository>();
        services.AddScoped<ICustomRoleRepository, SqlCustomRoleRepository>();
        services.AddScoped<IGlobalSearchRepository, SqlGlobalSearchRepository>();
        services.AddScoped<ITenantFirstValueReportBrandingRepository, SqlTenantFirstValueReportBrandingRepository>();
        services.AddScoped<ItsmInboundWebhookSyncService>();
        services.AddScoped<IValueReportMetricsReader, DapperValueReportMetricsReader>();
        services.AddScoped<IRunPipelineAuditTimelineService, RunPipelineAuditTimelineService>();
        services.AddScoped<IProvenanceSnapshotRepository, SqlProvenanceSnapshotRepository>();
        services.AddScoped<IProvenanceQueryService, ProvenanceQueryService>();
        services.AddScoped<IConversationThreadRepository, DapperConversationThreadRepository>();
        services.AddScoped<IConversationMessageRepository, DapperConversationMessageRepository>();
        services.AddScoped<IRecommendationRepository, DapperRecommendationRepository>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IRecommendationWorkflowService, RecommendationWorkflowService>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IRecommendationFeedbackAnalyzer, RecommendationFeedbackAnalyzer>();
        services.AddScoped<IRecommendationLearningProfileRepository, DapperRecommendationLearningProfileRepository>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IRecommendationLearningService, RecommendationLearningService>();
        services.AddScoped<ArchLucid.Decisioning.Advisory.Learning.IRecommendationLearningService>(sp => (ArchLucid.Decisioning.Advisory.Learning.IRecommendationLearningService)sp.GetRequiredService<ArchLucid.Core.Persistence.Ports.IRecommendationLearningService>());
        services.AddScoped<IAdvisoryScanScheduleRepository, DapperAdvisoryScanScheduleRepository>();
        services.AddScoped<IAdvisoryScanExecutionRepository, DapperAdvisoryScanExecutionRepository>();
        services.AddScoped<IArchitectureDigestRepository, DapperArchitectureDigestRepository>();
        services.AddScoped<IDigestSubscriptionRepository, DapperDigestSubscriptionRepository>();
        services.AddScoped<IDigestDeliveryAttemptRepository, DapperDigestDeliveryAttemptRepository>();
        services.AddScoped<IAlertRuleRepository, DapperAlertRuleRepository>();
        services.AddScoped<IAlertRecordRepository, DapperAlertRecordRepository>();
        services.AddScoped<IAlertRoutingSubscriptionRepository, DapperAlertRoutingSubscriptionRepository>();
        services.AddScoped<IAlertDeliveryAttemptRepository, DapperAlertDeliveryAttemptRepository>();
        services.AddScoped<ICompositeAlertRuleRepository, DapperCompositeAlertRuleRepository>();
        services.AddScoped<IPolicyPackVersionRepository, DapperPolicyPackVersionRepository>();
        services.AddScoped<IPolicyPackAssignmentRepository, DapperPolicyPackAssignmentRepository>();
        services.AddScoped<IPolicyPackChangeLogRepository, DapperPolicyPackChangeLogRepository>();
        services.AddScoped<IComplianceDriftFindingsTrendReader, DapperComplianceDriftFindingsTrendReader>();
        services.AddScoped<IPolicyPackCatalogRepository, DapperPolicyPackCatalogRepository>();
        services.AddScoped<IDataArchivalCoordinator, DataArchivalCoordinator>();
        services.AddScoped<IAgentTraceOrphanBlobCleanupService>(static sp => new AgentTraceOrphanBlobCleanupService(
            sp.GetRequiredService<IRunRepository>(),
            sp.GetRequiredService<IOptionsMonitor<ArtifactLargePayloadOptions>>(),
            sp.GetService<ITenantRegionalArtifactBlobClients>(),
            sp.GetService<BlobServiceClient>(),
            sp.GetRequiredService<ILogger<AgentTraceOrphanBlobCleanupService>>()));
        services.AddScoped<ITenantRepository, DapperTenantRepository>();
        services.AddScoped<IArchitectureProjectRepository, DapperArchitectureProjectRepository>();
        services.AddScoped<IArchitectureProjectRetentionPurgeService, SqlArchitectureProjectRetentionPurgeService>();
        services.AddScoped<IScimTenantTokenRepository, DapperScimTenantTokenRepository>();
        services.AddScoped<IScimUserRepository, DapperScimUserRepository>();
        services.AddScoped<IAdminNotificationsRepository, DapperAdminNotificationsRepository>();
        services.AddScoped<IScimGroupRepository, DapperScimGroupRepository>();
        services.AddScoped<IRoiBulletinAggregateReader, SqlRoiBulletinAggregateReader>();
        services.AddScoped<ITenantCustomerSuccessRepository, SqlTenantCustomerSuccessRepository>();
        services.AddScoped<ICorePilotTeamChecklistRepository, SqlCorePilotTeamChecklistRepository>();
        services.AddScoped<IOperatorStickinessSnapshotReader, SqlOperatorStickinessSnapshotReader>();
        services.AddScoped<IFindingFeedbackRepository, SqlFindingFeedbackRepository>();
        services.AddScoped<IFindingReviewTrailRepository, SqlFindingReviewTrailRepository>();
        services.AddScoped<IRiskExceptionRepository, SqlRiskExceptionRepository>();
        services.AddScoped<IArchitectureRiskRegisterQuery, ArchitectureRiskRegisterReader>();
        services.AddScoped<IArchitectureDecisionRegisterQuery, ArchitectureDecisionRegisterReader>();
        services.AddScoped<IImportedArchitectureRequestRepository, SqlImportedArchitectureRequestRepository>();
        services.AddScoped<IAzureExtractorPackageRepository, SqlAzureExtractorPackageRepository>();
        services.AddScoped<ITenantNotificationChannelPreferencesRepository, DapperTenantNotificationChannelPreferencesRepository>();
        services.AddScoped<IOperatorSavedViewRepository, DapperOperatorSavedViewRepository>();
        services.AddScoped<ITenantTeamsIncomingWebhookConnectionRepository, DapperTenantTeamsIncomingWebhookConnectionRepository>();
        services.AddScoped<ITenantExecDigestPreferencesRepository, DapperTenantExecDigestPreferencesRepository>();
        services.AddScoped<ITenantHardPurgeService, SqlTenantHardPurgeService>();
        services.AddScoped<IPlatformAuditRepository, DapperPlatformAuditRepository>();
        services.AddScoped<ITenantBlobPrefixDeletionService>(static sp => new TenantBlobPrefixDeletionService(
            sp.GetRequiredService<IOptionsMonitor<ArtifactLargePayloadOptions>>(),
            sp.GetService<ITenantRegionalArtifactBlobClients>(),
            sp.GetService<BlobServiceClient>()));
        services.AddScoped<ITenantDeletionService, TenantDeletionService>();
        services.AddScoped<ITenantErasureCommandService, TenantErasureCommandService>();
        services.AddScoped<IBillingLedger, SqlBillingLedger>();
        services.AddScoped<ITrialIdentityUserRepository, SqlTrialIdentityUserRepository>();
        services.AddScoped<IUsageEventRepository, DapperUsageEventRepository>();
        services.AddScoped<ILlmTenantBudgetRepository, SqlLlmTenantBudgetRepository>();
        services.AddScoped<ILlmTenantWalletRepository, SqlLlmTenantWalletRepository>();
        services.AddScoped<IReferenceEvidenceRunLookup, SqlReferenceEvidenceRunLookup>();
    }

    private static void RegisterBackgroundWorkerSqlResilience(IServiceCollection services)
    {
        services.AddSingleton<SqlResilientOperationExecutor>(sp =>
        {
            SqlOpenResilienceOptions sqlOpenOpts = sp.GetRequiredService<IOptions<SqlOpenResilienceOptions>>().Value;

            ResiliencePipeline operationPipeline = SqlOpenResilienceDefaults.BuildSqlOperationRetryPipeline(
                sp.GetRequiredService<ILogger<SqlResilientOperationExecutor>>(),
                sqlOpenOpts.MaxRetryAttempts,
                TimeSpan.FromMilliseconds(sqlOpenOpts.BaseDelayMilliseconds));

            return new SqlResilientOperationExecutor(operationPipeline);
        });

        services.AddSingleton<IBackgroundWorkerSqlConnectionFactory>(sp =>
        {
            SqlOpenResilienceOptions sqlOpenOpts = sp.GetRequiredService<IOptions<SqlOpenResilienceOptions>>().Value;

            ResiliencePipeline openPipeline = SqlOpenResilienceDefaults.BuildSqlOpenRetryPipeline(
                sp.GetRequiredService<ILogger<IBackgroundWorkerSqlConnectionFactory>>(),
                sqlOpenOpts.MaxRetryAttempts,
                TimeSpan.FromMilliseconds(sqlOpenOpts.BaseDelayMilliseconds));

            return new BackgroundWorkerResilientSqlConnectionFactory(
                sp.GetRequiredService<SqlConnectionFactory>(),
                openPipeline);
        });
    }

    private static void RegisterSqlOperationalSingletons(
        IServiceCollection services,
        IConfiguration configuration,
        string connectionString)
    {
        services.AddSingleton<IDbConnectionFactory>(p =>
            new SqlScopedResolutionDbConnectionFactory(
                p.GetRequiredService<IServiceScopeFactory>(),
                connectionString,
                p.GetRequiredService<IOptionsMonitor<SqlServerOptions>>()));

        ArchLucidStorageServiceCollectionExtensions.RegisterHostLeaderLeaseInfrastructure(services);
        services.AddSingleton<IHostLeaderLeaseRepository, SqlHostLeaderLeaseRepository>();

        // Scoped: DapperTrialFunnelOperationalMetricsReader takes ISqlConnectionFactory (scoped); hosted service resolves it per scope.
        services.AddScoped<ITrialFunnelOperationalMetricsReader, DapperTrialFunnelOperationalMetricsReader>();
        services.AddScoped<ITrialFunnelCommitHook, SqlTrialFunnelCommitHook>();
        services.AddScoped<ITenantOnboardingStateRepository, SqlTenantOnboardingStateRepository>();
        services.AddScoped<IFirstSessionLifecycleHook, SqlFirstSessionLifecycleHook>();

        services.AddScoped<IOutboxOperationalMetricsReader, DapperOutboxOperationalMetricsReader>();
        services.AddHostedService<OutboxOperationalMetricsHostedService>();
        services.AddHostedService<LlmTenantBudgetUtilizationMetricsHostedService>();
        services.AddHostedService<MarketingPricingQuoteAgingMetricsHostedService>();
        services.AddHostedService<SqlConnectionPoolMetricsHostedService>();

        services.AddSingleton<DataConsistencyOrphanProbeExecutor>();
        services.AddSingleton<IDataConsistencyOrphanProbeExecutor>(
            static sp => sp.GetRequiredService<DataConsistencyOrphanProbeExecutor>());
        services.AddSingleton<IArchLucidJob, OrphanProbeArchLucidJob>();

        if (!ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.OrphanProbe))

            services.AddHostedService<DataConsistencyOrphanProbeHostedService>();

        RegisterDtfOrchestrationInfrastructure(services, configuration, connectionString);
    }

    /// <summary>
    ///     Registers Durable Task Framework worker and client when <see cref="IsDtfEnabled" /> is true.
    /// </summary>
    /// <param name="connectionString">
    ///     ArchLucid tenant-plane SQL connection string. Orchestration history is not written here by the
    ///     <c>Microsoft.DurableTask.Worker</c> process itself (it uses gRPC); when the out-of-process durable engine is
    ///     configured with the MSSQL provider against this same catalog, the provider creates and owns
    ///     <c>dt.</c>-prefixed objects — include them in DBA backup/restore/retention runbooks alongside ArchLucid tables.
    /// </param>
    /// <remarks>
    ///     <para>
    ///         The GA task note referenced <c>builder.UseSqlServer(connectionString)</c>; that API is not exposed on
    ///         <see cref="T:Microsoft.DurableTask.Worker.IDurableTaskWorkerBuilder" /> for <c>Microsoft.DurableTask.Worker</c> 1.x
    ///         (SQL persistence is the legacy <c>DurableTask.SqlServer</c> / WebJobs stack or lives behind a gRPC sidecar).
    ///     </para>
    ///     <para>
    ///         Configure the worker/client transport with <c>ArchLucid:AuthorityPipeline:DurableTask:GrpcEndpoint</c>
    ///         (Durable Task Scheduler, emulator, or another engine exposing the Durable Task gRPC contract).
    ///     </para>
    /// </remarks>
    private static void RegisterDtfOrchestrationInfrastructure(
        IServiceCollection services,
        IConfiguration configuration,
        string connectionString)
    {
        if (!IsDtfEnabled(configuration))
            return;

        ArgumentNullException.ThrowIfNull(connectionString);

        string? grpcEndpoint = configuration["ArchLucid:AuthorityPipeline:DurableTask:GrpcEndpoint"];

        if (string.IsNullOrWhiteSpace(grpcEndpoint))
            throw new InvalidOperationException(
                "ArchLucid:AuthorityPipeline:OrchestratorBackend is DurableTask but ArchLucid:AuthorityPipeline:DurableTask:GrpcEndpoint is empty. "
                + "Set a gRPC address for the Durable Task worker (scheduler / sidecar).");

        services.AddDurableTaskWorker(builder =>
        {
            builder.AddTasks(registry => registry.AddAllGeneratedTasks());
            builder.UseGrpc(grpcEndpoint.Trim());
        });

        services.AddDurableTaskClient(builder =>
        {
            builder.UseGrpc(grpcEndpoint.Trim());
        });
    }

    private static bool IsDtfEnabled(IConfiguration configuration)
    {
        string? raw = configuration["ArchLucid:AuthorityPipeline:OrchestratorBackend"];

        return !string.IsNullOrWhiteSpace(raw)
               && string.Equals(raw.Trim(), "DurableTask", StringComparison.OrdinalIgnoreCase);
    }
}
