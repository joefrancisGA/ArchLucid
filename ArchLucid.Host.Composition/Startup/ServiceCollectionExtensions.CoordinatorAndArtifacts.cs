using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.Explanation;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Ask;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Decisions;
using ArchLucid.Core.Budgeting;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Explanation;
using ArchLucid.Core.Explanation;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Costing;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Http;
using ArchLucid.Core.Llm;
using ArchLucid.Core.QuickScan;
using ArchLucid.Decisioning.Advisory.Analysis;
using ArchLucid.Decisioning.Advisory.Learning;
using ArchLucid.Decisioning.Advisory.Services;
using ArchLucid.Decisioning.Comparison;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Host.Core.Ask;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Llm;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Host.Core.Services.Drafts;
using ArchLucid.Host.Core.Startup;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Coordination.Caching;
using ArchLucid.Persistence.Architecture;
using ArchLucid.Persistence.Budgeting;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Reads;
using ArchLucid.Persistence.Repositories;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    // TB-305 / ADR 0042 (decision D): DecisionEngineV2, IDecisionNodeRepository, and DecisionNodeManifestMerger are LIVE
    // authority-pipeline components (consumed by AuthorityDrivenArchitectureRunCommitOrchestrator), not vestigial coordinator
    // primitives. The legacy coordinator repository family was deleted in ADR 0030 PR A3; this registration is authority-side.
    private static void RegisterAuthorityDecisionEngineAndRepositories(
        IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddScoped<IArchitectureRunAuthorityCoordination, ArchitectureRunAuthorityCoordination>();
        services.AddSchemaValidation(configuration);
        services.AddScoped<DecisionMergeInputGate>();
        services.AddScoped<AgentProposalManifestMerger>();
        services.AddScoped<DecisionNodeManifestMerger>();
        services.AddScoped<ManifestGovernanceMerger>();
        services.AddScoped<IDecisionEngineService, DecisionEngineService>();
        services.AddScoped<IDecisionEngineV2, DecisionEngineV2>();
        services.AddSingleton<IComparisonService, ComparisonService>();
        services.AddSingleton<IImprovementSignalAnalyzer, ImprovementSignalAnalyzer>();
        services.AddSingleton<IAdaptiveRecommendationScorer, AdaptiveRecommendationScorer>();
        services.AddSingleton<IRecommendationLearningAnalyzer, RecommendationLearningAnalyzer>();
        services.AddSingleton<IRecommendationGenerator, RecommendationGenerator>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IImprovementAdvisorService, ImprovementAdvisorService>();
        services.AddScoped<ArchLucid.Decisioning.Advisory.Services.IImprovementAdvisorService>(sp => (ArchLucid.Decisioning.Advisory.Services.IImprovementAdvisorService)sp.GetRequiredService<ArchLucid.Core.Persistence.Ports.IImprovementAdvisorService>());
        services.Configure<ExplanationServiceOptions>(
            configuration.GetSection(ExplanationServiceOptions.SectionPath));
        services.Configure<RunExplanationAggregateOptions>(
            configuration.GetSection(RunExplanationAggregateOptions.SectionPath));
        // Binds AgentExecution:LlmCostEstimation; option type defaults keep cost visibility on when the section is absent.
        services.AddOptions<LlmCostEstimationOptions>()
            .Bind(configuration.GetSection(LlmCostEstimationOptions.SectionPath))
            .ValidateOnStart();
        services.AddSingleton<IValidateOptions<LlmCostEstimationOptions>, LlmCostEstimationOptionsValidator>();
        services.AddSingleton<IPostConfigureOptions<LlmCostEstimationOptions>, LlmCostEstimationStartupRateWarningPostConfigure>();

        ArchLucidOptions storageOptions = ArchLucidConfigurationBridge.ResolveArchLucidOptions(configuration);
        RegisterLlmCostEstimationUsdRateOverride(services, storageOptions);
        services.AddSingleton<ILlmCostEstimator, LlmCostEstimator>();
        services.AddSingleton<IDeterministicExplanationService, DeterministicExplanationService>();
        services.AddScoped<IExplanationService, ExplanationService>();
        services.AddScoped<IFindingExplainabilityComposer, FindingExplainabilityComposer>();
        RegisterRunExplanationSummaryService(services, configuration);
        services.AddScoped<IConversationService, ConversationService>();
        services.AddScoped<ArchLucid.Core.Llm.IAgentCompletionClient, JsonCompletionClientAdapter>();
        services.Configure<AskComparisonNarrativeOptions>(
            configuration.GetSection(AskComparisonNarrativeOptions.SectionPath));
        services.Configure<ConversationContextOptions>(
            configuration.GetSection(ConversationContextOptions.SectionPath));
        services.Configure<AskRetrievalOptions>(
            configuration.GetSection(AskRetrievalOptions.SectionPath));
        services.AddScoped<IConversationContextCompressor, ConversationContextCompressor>();
        services.AddScoped<AskConversationHistoryBuilder>();
        services.AddScoped<AskContextPreparer>();
        services.AddScoped<AskComparisonNarrativeBuilder>();
        services.AddScoped<AskResponseComposer>();
        services.AddScoped<IAskService, AskService>();
        services.AddScoped<IDraftIntakeReasoningService, DraftIntakeReasoningService>();
        services.AddScoped<IDraftSemanticAdmissionEvaluator, HostDraftSemanticAdmissionEvaluator>();
        services.AddScoped<IPreCommitGovernanceBlockExplainer, PreCommitGovernanceBlockExplainer>();
        services.AddScoped<IAgentEvaluationService, FindingsBackedAgentEvaluationService>();
        services.AddScoped<DefaultEvidenceBuilder>();
        services.AddScoped<EffectiveGovernanceSnapshotBuilder>();
        services.AddScoped<IEvidenceBuilder, WorkspacePolicyPackEvidenceBuilder>();
        services.AddScoped<IAgentExecutionTraceRecorder, AgentExecutionTraceRecorder>();
        services.AddScoped<ICommitRunIdempotencyCoordinator, CommitRunIdempotencyCoordinator>();

        // ADR 0030 PR A3 (2026-04-24): ICoordinatorGoldenManifestRepository and ICoordinatorDecisionTraceRepository
        // were deleted along with their concretes (InMemoryCoordinator*, GoldenManifestRepository, DecisionTraceRepository).
        // dbo.GoldenManifestVersions is gone (PR A4 / migration 111); decision traces are persisted via the
        // Authority FK chain (dbo.AuthorityDecisionTraces). The unified reader stays scoped (now authority-only).
        if (ArchLucidOptions.EffectiveIsInMemory(storageOptions.StorageProvider))
        {
            services.AddSingleton<IArchitectureRequestRepository, InMemoryArchitectureRequestRepository>();
            services.AddSingleton<IArchitectureRunIdempotencyRepository, InMemoryArchitectureRunIdempotencyRepository>();
            services.AddSingleton<ICommitRunIdempotencyRepository, InMemoryCommitRunIdempotencyRepository>();
            services.AddSingleton<IIdempotencyRecordRepository, InMemoryIdempotencyRecordRepository>();
            services.AddSingleton<IProjectRoleAssignmentRepository, InMemoryProjectRoleAssignmentRepository>();
            services.AddSingleton<IAgentTaskRepository, InMemoryAgentTaskRepository>();
            services.AddSingleton<IAgentResultEnrichmentRepository, InMemoryAgentResultEnrichmentRepository>();
            services.AddSingleton<IAgentResultRepository, InMemoryAgentResultRepository>();
            services.AddSingleton<IAgentEvaluationRepository, InMemoryAgentEvaluationRepository>();
            services.AddSingleton<IDecisionNodeRepository, InMemoryDecisionNodeRepository>();
            services.AddScoped<IUnifiedGoldenManifestReader, UnifiedGoldenManifestReader>();
            services.AddSingleton<IEvidenceBundleRepository, InMemoryEvidenceBundleRepository>();
            services.AddSingleton<IAgentEvidencePackageRepository, InMemoryAgentEvidencePackageRepository>();
            services.AddSingleton<IAgentExecutionTraceRepository, InMemoryAgentExecutionTraceRepository>();
            services.AddSingleton<ITechnologyLedgerRepository, InMemoryTechnologyLedgerRepository>();
            services.AddSingleton<ICoverageAssignmentRepository, InMemoryCoverageAssignmentRepository>();
            services.AddSingleton<IAgentOutputEvaluationResultRepository, NoOpAgentOutputEvaluationResultRepository>();
            services.AddSingleton<IAgentOutputEvaluationRepository, NoOpAgentOutputEvaluationRepository>();
            services.AddSingleton<IPromptVariantStatsRepository, NoOpPromptVariantStatsRepository>();
            services.AddSingleton<IAgentConfidenceCalibrationSampleRepository, NoOpAgentConfidenceCalibrationSampleRepository>();
            services.AddSingleton<ITenantCuratedEvidenceRepository, NoOpTenantCuratedEvidenceRepository>();
            services.AddSingleton<InMemoryQuickScanGlobalBudgetReservationStore>();
            services.AddSingleton<IQuickScanGlobalBudgetReservationStore>(sp =>
                sp.GetRequiredService<InMemoryQuickScanGlobalBudgetReservationStore>());
            services.AddSingleton<InMemoryRunScopedLlmBudgetReservationStore>();
            services.AddSingleton<IRunScopedLlmBudgetReservationStore>(sp =>
                sp.GetRequiredService<InMemoryRunScopedLlmBudgetReservationStore>());
            services.AddSingleton<InMemoryLlmMonthlyTenantBudgetReservationStore>();
            services.AddSingleton<ILlmMonthlyTenantBudgetReservationStore>(sp =>
                sp.GetRequiredService<InMemoryLlmMonthlyTenantBudgetReservationStore>());
            services.AddSingleton<InMemoryQuickScanDistributedConcurrencyStore>();
            services.AddSingleton<IQuickScanDistributedConcurrencyStore>(sp =>
                sp.GetRequiredService<InMemoryQuickScanDistributedConcurrencyStore>());
            services.AddSingleton<InMemoryQuickScanIdentityAbuseStore>();
            services.AddSingleton<IQuickScanIdentityAbuseStore>(sp =>
                sp.GetRequiredService<InMemoryQuickScanIdentityAbuseStore>());
            services.AddSingleton<InMemoryQuickScanSafetyOperationalStateStore>();
            services.AddSingleton<IQuickScanSafetyOperationalStateStore>(sp =>
                sp.GetRequiredService<InMemoryQuickScanSafetyOperationalStateStore>());
            services.AddSingleton<InMemoryQuickScanUsageRecordStore>();
            services.AddSingleton<IQuickScanUsageRecordStore>(sp =>
                sp.GetRequiredService<InMemoryQuickScanUsageRecordStore>());
            return;
        }

        services.AddScoped<IAgentEvaluationRepository, AgentEvaluationRepository>();
        services.AddScoped<IDecisionNodeRepository, DecisionNodeRepository>();
        services.AddScoped<IArchitectureRequestRepository, ArchitectureRequestRepository>();
        services.AddScoped<IArchitectureRunIdempotencyRepository, ArchitectureRunIdempotencyRepository>();
        services.AddScoped<ICommitRunIdempotencyRepository, CommitRunIdempotencyRepository>();
        services.AddScoped<IIdempotencyRecordRepository, IdempotencyRecordRepository>();
        services.AddSingleton<IQuickScanGlobalBudgetReservationStore, DapperQuickScanGlobalBudgetReservationStore>();
        services.AddSingleton<IQuickScanDistributedConcurrencyStore, DapperQuickScanDistributedConcurrencyStore>();
        services.AddSingleton<IQuickScanIdentityAbuseStore, DapperQuickScanIdentityAbuseStore>();
        services.AddSingleton<IQuickScanSafetyOperationalStateStore, DapperQuickScanSafetyOperationalStateStore>();
        services.AddSingleton<IQuickScanUsageRecordStore, DapperQuickScanUsageRecordStore>();
        services.AddSingleton<IRunScopedLlmBudgetReservationStore, DapperRunScopedLlmBudgetReservationStore>();
        services.AddSingleton<ILlmMonthlyTenantBudgetReservationStore, DapperLlmMonthlyTenantBudgetReservationStore>();
        services.AddScoped<IProjectRoleAssignmentRepository, ProjectRoleAssignmentRepository>();
        services.AddScoped<IAgentTaskRepository, AgentTaskRepository>();
        services.AddScoped<IAgentResultEnrichmentRepository, AgentResultEnrichmentRepository>();
        services.AddScoped<IAgentResultRepository, AgentResultRepository>();
        services.AddScoped<IUnifiedGoldenManifestReader, UnifiedGoldenManifestReader>();
        services.AddScoped<IEvidenceBundleRepository, EvidenceBundleRepository>();
        services.AddScoped<IAgentEvidencePackageRepository, AgentEvidencePackageRepository>();
        services.AddScoped<IAgentExecutionTraceRepository, AgentExecutionTraceRepository>();
        services.AddScoped<ITechnologyLedgerRepository, TechnologyLedgerRepository>();
        services.AddScoped<ICoverageAssignmentRepository, DapperCoverageAssignmentRepository>();
        services.AddScoped<IAgentOutputEvaluationResultRepository, AgentOutputEvaluationResultRepository>();
        services.AddScoped<IAgentOutputEvaluationRepository, AgentOutputEvaluationRepository>();
        services.AddScoped<IPromptVariantStatsRepository, SqlPromptVariantStatsRepository>();
        services.AddScoped<IAgentConfidenceCalibrationSampleRepository, AgentConfidenceCalibrationSampleRepository>();
        services.AddScoped<ITenantCuratedEvidenceRepository, TenantCuratedEvidenceRepository>();
    }

    private static void RegisterRunExplanationSummaryService(
        IServiceCollection services,
        IConfiguration configuration)
    {
        HotPathCacheOptions hotPath = configuration
                                          .GetSection(HotPathCacheOptions.SectionName)
                                          .Get<HotPathCacheOptions>()
                                      ?? new HotPathCacheOptions();

        if (!hotPath.Enabled)
        {
            services.AddScoped<IRunExplanationSummaryService, RunExplanationSummaryService>();
            return;
        }

        services.AddScoped<RunExplanationSummaryService>();
        services.AddScoped<IRunExplanationSummaryService>(sp => new CachingRunExplanationSummaryService(
            sp.GetRequiredService<RunExplanationSummaryService>(),
            sp.GetRequiredService<IHotPathReadCache>(),
            sp.GetRequiredService<IAuthorityQueryService>(),
            sp.GetRequiredService<ILogger<CachingRunExplanationSummaryService>>()));
    }

    private static void RegisterLlmCostEstimationUsdRateOverride(IServiceCollection services, ArchLucidOptions storageOptions)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(storageOptions.StorageProvider))
        {
            services.AddSingleton<ILlmCostEstimationUsdRateOverride>(NoOpLlmCostEstimationUsdRateOverride.Instance);

            return;
        }

        services.AddSingleton<LlmCostEstimationUsdRateOverrideCache>();
        services.AddSingleton<ILlmCostEstimationUsdRateOverride>(static sp =>
            sp.GetRequiredService<LlmCostEstimationUsdRateOverrideCache>());
        services.AddScoped<ILlmCostEstimationUsdRateOverrideRepository, SqlLlmCostEstimationUsdRateOverrideRepository>();
        services.AddHostedService<LlmCostEstimationUsdRateOverrideWarmupHostedService>();
    }

    private static void RegisterArtifactSynthesis(IServiceCollection services)
    {
        RegisterInfrastructureCostSizing(services);

        services.AddSingleton<IArtifactContentTypeResolver, ArtifactContentTypeResolver>();
        services.AddSingleton<IArtifactPackagingService, ArtifactPackagingService>();
        services.AddSingleton<IArtifactBundleValidator, ArtifactBundleValidator>();
        services.AddSingleton<ITechnologyLedgerArtifactLinter, TechnologyLedgerArtifactLinter>();
        services.AddSingleton<IDiagramRenderer, MermaidDiagramRenderer>();
        services.AddScoped<IArtifactGenerator, ReferenceArchitectureMarkdownGenerator>();
        services.AddScoped<IArtifactGenerator, ArchitectureNarrativeArtifactGenerator>();
        services.AddScoped<IArtifactGenerator, ComplianceMatrixArtifactGenerator>();
        services.AddScoped<IArtifactGenerator, CoverageSummaryArtifactGenerator>();
        services.AddScoped<IArtifactGenerator, DiagramAstGenerator>();
        services.AddScoped<IArtifactGenerator, MermaidDiagramArtifactGenerator>();
        services.AddScoped<IArtifactGenerator, InventoryArtifactGenerator>();
        services.AddScoped<IArtifactGenerator>(static sp =>
            new CostSummaryArtifactGenerator(sp.GetRequiredService<IInfrastructureCostArtifactAugmentationProvider>()));
        services.AddSingleton<ArchLucid.Core.Terraform.ITerraformValidator, ArchLucid.ArtifactSynthesis.Validation.CompositeTerraformValidator>();
        services.AddScoped<IArtifactGenerator, TerraformAdvisoryArtifactGenerator>();
        services.AddScoped<IArtifactGenerator, UnresolvedIssuesArtifactGenerator>();
        services.AddScoped<IArtifactSynthesisService, ArtifactSynthesisService>();
        services.AddScoped<IDocxExportService, DocxExportService>();
        services.AddSingleton<IValueReportRenderer, DocxValueReportRenderer>();
    }

    /// <summary>Registers outbound Retail probing plus artifact augmentation injected into cost summaries.</summary>
    private static void RegisterInfrastructureCostSizing(IServiceCollection services)
    {
        services.AddSingleton<AzureRetailPricesCatalogClient>(
            static sp =>
                new AzureRetailPricesCatalogClient(
                    () =>
                        sp.GetRequiredService<IHttpClientFactory>()
                            .CreateClient(ArchLucidAzurePublicHttpClients.RetailPricesHttpClientName),
                    TimeProvider.System,
                    sp.GetRequiredService<ILogger<AzureRetailPricesCatalogClient>>()));

        services.AddSingleton<AwsPublicPricingClient>(
            static sp =>
                new AwsPublicPricingClient(
                    () =>
                        sp.GetRequiredService<IHttpClientFactory>()
                            .CreateClient(ArchLucidMultiCloudPublicHttpClients.AwsPricingHttpClientName),
                    TimeProvider.System,
                    sp.GetRequiredService<ILogger<AwsPublicPricingClient>>()));

        services.AddSingleton<GcpCloudBillingCatalogClient>(
            static sp =>
                new GcpCloudBillingCatalogClient(
                    () =>
                        sp.GetRequiredService<IHttpClientFactory>()
                            .CreateClient(ArchLucidMultiCloudPublicHttpClients.GcpCloudBillingHttpClientName),
                    sp.GetRequiredService<IOptionsMonitor<GcpBillingCatalogOptions>>(),
                    TimeProvider.System,
                    sp.GetRequiredService<ILogger<GcpCloudBillingCatalogClient>>()));

        services.AddSingleton<IInfrastructureCostArtifactAugmentationProvider,
            MultiCloudInfrastructureCostArtifactAugmentationProvider>();
    }
}
