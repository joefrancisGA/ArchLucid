using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.Explanation;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Explanation;
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
using ArchLucid.Core.Http;
using ArchLucid.Decisioning.Advisory.Analysis;
using ArchLucid.Decisioning.Advisory.Learning;
using ArchLucid.Decisioning.Advisory.Services;
using ArchLucid.Decisioning.Comparison;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Host.Core.Ask;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Coordination.Caching;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Reads;
using ArchLucid.Persistence.Repositories;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static void RegisterCoordinatorDecisionEngineAndRepositories(
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
        services.AddScoped<IImprovementAdvisorService, ImprovementAdvisorService>();
        services.Configure<ExplanationServiceOptions>(
            configuration.GetSection(ExplanationServiceOptions.SectionPath));
        services.Configure<RunExplanationAggregateOptions>(
            configuration.GetSection(RunExplanationAggregateOptions.SectionPath));
        // Binds AgentExecution:LlmCostEstimation; option type defaults keep cost visibility on when the section is absent.
        services.Configure<LlmCostEstimationOptions>(
            configuration.GetSection(LlmCostEstimationOptions.SectionPath));

        ArchLucidOptions coordinatorStorage = ArchLucidConfigurationBridge.ResolveArchLucidOptions(configuration);
        RegisterLlmCostEstimationUsdRateOverride(services, coordinatorStorage);
        services.AddSingleton<ILlmCostEstimator, LlmCostEstimator>();
        services.AddSingleton<IDeterministicExplanationService, DeterministicExplanationService>();
        services.AddScoped<IExplanationService, ExplanationService>();
        RegisterRunExplanationSummaryService(services, configuration);
        services.AddScoped<IConversationService, ConversationService>();
        services.AddScoped<IAskService, AskService>();
        services.AddScoped<IAgentEvaluationService, FindingsBackedAgentEvaluationService>();
        services.AddScoped<IEvidenceBuilder, DefaultEvidenceBuilder>();
        services.AddScoped<IAgentExecutionTraceRecorder, AgentExecutionTraceRecorder>();

        // ADR 0030 PR A3 (2026-04-24): ICoordinatorGoldenManifestRepository and ICoordinatorDecisionTraceRepository
        // were deleted along with their concretes (InMemoryCoordinator*, GoldenManifestRepository, DecisionTraceRepository).
        // dbo.GoldenManifestVersions is gone (PR A4 / migration 111); decision traces are persisted via the
        // Authority FK chain (dbo.AuthorityDecisionTraces). The unified reader stays scoped (now authority-only).
        if (ArchLucidOptions.EffectiveIsInMemory(coordinatorStorage.StorageProvider))
        {
            services.AddSingleton<IArchitectureRequestRepository, InMemoryArchitectureRequestRepository>();
            services.AddSingleton<IArchitectureRunIdempotencyRepository, InMemoryArchitectureRunIdempotencyRepository>();
            services.AddSingleton<ICommitRunIdempotencyRepository, InMemoryCommitRunIdempotencyRepository>();
            services.AddSingleton<IProjectRoleAssignmentRepository, InMemoryProjectRoleAssignmentRepository>();
            services.AddSingleton<IAgentTaskRepository, InMemoryAgentTaskRepository>();
            services.AddSingleton<IAgentResultRepository, InMemoryAgentResultRepository>();
            services.AddSingleton<IAgentEvaluationRepository, InMemoryAgentEvaluationRepository>();
            services.AddSingleton<IDecisionNodeRepository, InMemoryDecisionNodeRepository>();
            services.AddScoped<IUnifiedGoldenManifestReader, UnifiedGoldenManifestReader>();
            services.AddSingleton<IEvidenceBundleRepository, InMemoryEvidenceBundleRepository>();
            services.AddSingleton<IAgentEvidencePackageRepository, InMemoryAgentEvidencePackageRepository>();
            services.AddSingleton<IAgentExecutionTraceRepository, InMemoryAgentExecutionTraceRepository>();
            services.AddSingleton<IAgentOutputEvaluationResultRepository, NoOpAgentOutputEvaluationResultRepository>();
            return;
        }

        services.AddScoped<IAgentEvaluationRepository, AgentEvaluationRepository>();
        services.AddScoped<IDecisionNodeRepository, DecisionNodeRepository>();
        services.AddScoped<IArchitectureRequestRepository, ArchitectureRequestRepository>();
        services.AddScoped<IArchitectureRunIdempotencyRepository, ArchitectureRunIdempotencyRepository>();
        services.AddScoped<ICommitRunIdempotencyRepository, CommitRunIdempotencyRepository>();
        services.AddScoped<IProjectRoleAssignmentRepository, ProjectRoleAssignmentRepository>();
        services.AddScoped<IAgentTaskRepository, AgentTaskRepository>();
        services.AddScoped<IAgentResultRepository, AgentResultRepository>();
        services.AddScoped<IUnifiedGoldenManifestReader, UnifiedGoldenManifestReader>();
        services.AddScoped<IEvidenceBundleRepository, EvidenceBundleRepository>();
        services.AddScoped<IAgentEvidencePackageRepository, AgentEvidencePackageRepository>();
        services.AddScoped<IAgentExecutionTraceRepository, AgentExecutionTraceRepository>();
        services.AddScoped<IAgentOutputEvaluationResultRepository, AgentOutputEvaluationResultRepository>();
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

    private static void RegisterLlmCostEstimationUsdRateOverride(IServiceCollection services, ArchLucidOptions coordinatorStorage)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(coordinatorStorage.StorageProvider))
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

        services.AddSingleton<IInfrastructureCostArtifactAugmentationProvider, RetailInfrastructureCostArtifactAugmentationProvider>();
    }
}
