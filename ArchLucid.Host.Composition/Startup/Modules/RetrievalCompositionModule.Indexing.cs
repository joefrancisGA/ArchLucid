using ArchLucid.AgentRuntime;
using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Core.Admin;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Composition.AzureOpenAI;
using ArchLucid.Host.Composition.Startup.Modules;
using ArchLucid.Retrieval.Admin;
using ArchLucid.Retrieval.Agentic;
using ArchLucid.Retrieval.Chunking;
using ArchLucid.Retrieval.Citations;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.FineTuning;
using ArchLucid.Retrieval.FineTuning.Consent;
using ArchLucid.Retrieval.FineTuning.Evaluation;
using ArchLucid.Retrieval.FineTuning.Export;
using ArchLucid.Retrieval.FineTuning.Orchestration;
using ArchLucid.Retrieval.FineTuning.Redaction;
using ArchLucid.Retrieval.FineTuning.Registry;
using ArchLucid.Retrieval.Graph;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.PolicyPacks;
using ArchLucid.Retrieval.Pricing;
using ArchLucid.Retrieval.ProductLearning;
using ArchLucid.Retrieval.Queries;
using ArchLucid.Retrieval.Reranking;
using ArchLucid.AgentRuntime.FineTuning;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Startup.Modules;

partial class RetrievalCompositionModule
{
    private static void RegisterIndexing(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<RetrievalEmbeddingCapOptions>(
            configuration.GetSection(RetrievalEmbeddingCapOptions.SectionName));
        services.Configure<RetrievalEmbeddingModelOptions>(
            configuration.GetSection(RetrievalEmbeddingModelOptions.SectionName));
        services.Configure<RetrievalRerankingOptions>(configuration.GetSection(RetrievalRerankingOptions.SectionPath));
        services.Configure<AdvancedRetrievalOptions>(configuration.GetSection(AdvancedRetrievalOptions.SectionPath));
        services.Configure<RetrievalQueryBudgetOptions>(configuration.GetSection(RetrievalQueryBudgetOptions.SectionPath));
        services.Configure<PriorManifestRetrievalOptions>(configuration.GetSection(PriorManifestRetrievalOptions.SectionPath));
        services.Configure<FineTuningOptions>(configuration.GetSection(FineTuningOptions.SectionPath));
        services.Configure<ManifestChunkSummarizationOptions>(
            configuration.GetSection(ManifestChunkSummarizationOptions.SectionPath));
        services.Configure<RetrievalChunkingOptions>(configuration.GetSection(RetrievalChunkingOptions.SectionPath));
        services.Configure<ProductLearningPlanningRetrievalOptions>(
            configuration.GetSection(ProductLearningPlanningRetrievalOptions.SectionPath));

        services.AddSingleton<PassThroughRetrievalReranker>();
        services.AddSingleton<LexicalOverlapRetrievalReranker>();
        services.AddSingleton<IRetrievalReranker, AzureAiSearchSemanticRetrievalReranker>();

        services.AddSingleton<SimpleTextChunker>();
        services.AddSingleton<StructureAwareTextChunker>();
        services.AddSingleton<ITextChunker>(static sp => sp.GetRequiredService<SimpleTextChunker>());
        services.AddSingleton<PolicyPackChunker>();
        services.AddSingleton<PriorManifestChunker>();
        services.AddScoped<IRetrievalDocumentBuilder, RetrievalDocumentBuilder>();
        services.AddSingleton<IRetrievalDocumentIndexCatalog, InMemoryRetrievalDocumentIndexCatalog>();
        services.AddScoped<IAdminRagHealthQuery, AdminRagHealthQuery>();
        services.AddScoped<IRetrievalIndexingService, RetrievalIndexingService>();
        services.AddScoped<AssignedPolicyPackRulePackIdResolver>();
        services.AddScoped<AgentPolicyPackRulePackIdResolver>();
        services.AddScoped<AgentPolicyPackRetrievalAppender>();
        services.AddSingleton<IRetrievalCitationFormatter, RetrievalCitationFormatter>();
        services.AddScoped<IterativeRetrievalLoop>();
        services.AddScoped<IGraphRagNeighborExpander, GraphRagNeighborExpander>();
        services.AddSingleton<IGraphCommunityDetector, LouvainGraphCommunityDetector>();
        services.AddScoped<IRetrievalQueryService, RetrievalQueryService>();
        services.AddScoped<IProductLearningPlanningRetrievalContributor, ProductLearningPlanningRetrievalContributor>();
        services.AddScoped<IRetrievalRunCompletionIndexer, RetrievalRunCompletionIndexer>();

        RegisterFineTuning(services, configuration);

        services.Configure<AzureSearchOptions>(configuration.GetSection(AzureSearchOptions.SectionPath));

        string? azureSearchEndpoint = configuration["Retrieval:AzureSearch:Endpoint"];

        if (!string.IsNullOrWhiteSpace(azureSearchEndpoint))
            services.AddSingleton<IAzureSearchClient, AzureSearchSdkClient>();
        else
            services.AddSingleton<IAzureSearchClient, NotConfiguredAzureSearchClient>();

        string vectorMode = configuration["Retrieval:VectorIndex"] ?? "InMemory";

        if (string.Equals(vectorMode, "AzureSearch", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<IVectorIndex, AzureAiSearchVectorIndex>();
            services.AddSingleton<IVectorIndexEmbeddingMetadataProvider>(_ => NullVectorIndexEmbeddingMetadataProvider.Instance);
        }
        else
        {
            services.AddSingleton<InMemoryVectorIndex>(static sp =>
                new InMemoryVectorIndex(sp.GetRequiredService<IScopeContextProvider>()));
            services.AddSingleton<IVectorIndex>(static sp => sp.GetRequiredService<InMemoryVectorIndex>());
            services.AddSingleton<IVectorIndexEmbeddingMetadataProvider>(static sp =>
                sp.GetRequiredService<InMemoryVectorIndex>());
        }

        services.Configure<PolicyPackCorpusIndexerOptions>(configuration.GetSection(PolicyPackCorpusIndexerOptions.SectionPath));
        services.AddSingleton<PolicyPackCorpusIndexer>();
        services.AddHostedService<PolicyPackCorpusStartupIndexerHostedService>();

        services.Configure<PlatformDocCorpusIndexerOptions>(configuration.GetSection(PlatformDocCorpusIndexerOptions.SectionPath));
        services.AddSingleton<PlatformDocCorpusIndexer>();
        services.AddHostedService<PlatformDocCorpusStartupIndexerHostedService>();

        services.Configure<ExemplarCorpusIndexerOptions>(configuration.GetSection(ExemplarCorpusIndexerOptions.SectionPath));
        services.AddSingleton<ExemplarCorpusIndexer>();
        services.AddHostedService<ExemplarCorpusStartupIndexerHostedService>();

        services.AddScoped<IAzureRetailPriceTenantCostSettingsContext, ScopedAzureRetailPriceTenantCostSettingsContext>();
        services.AddScoped<AzureRetailPricesCatalogStructuredLookup>();
        services.AddScoped<IAzureRetailPriceStructuredLookup>(static sp =>
            new CachedAzureRetailPriceStructuredLookup(
                sp.GetRequiredService<AzureRetailPricesCatalogStructuredLookup>(),
                sp.GetRequiredService<IMemoryCache>(),
                sp.GetRequiredService<IAzureRetailPriceTenantCostSettingsContext>(),
                TimeProvider.System));
        services.AddScoped<AwsPublicPricingStructuredLookup>();
        services.AddScoped<IAwsRetailPriceStructuredLookup>(static sp =>
            sp.GetRequiredService<AwsPublicPricingStructuredLookup>());
        services.AddScoped<GcpCloudBillingCatalogStructuredLookup>();
        services.AddScoped<IGcpRetailPriceStructuredLookup>(static sp =>
            sp.GetRequiredService<GcpCloudBillingCatalogStructuredLookup>());
        services.AddScoped<CostRetailGroundingLookups>();
    }

    private static void RegisterFineTuning(IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IFineTuningConsentService, FineTuningConsentService>();
        services.AddScoped<IAcceptedManifestTrainingRedactor, AcceptedManifestTrainingRedactor>();
        services.AddScoped<IAcceptedManifestTrainingDataExporter, AcceptedManifestTrainingDataExporter>();
        services.AddScoped<IFineTuningPromotionGate, GoldenCohortFineTuningPromotionGate>();
        services.AddScoped<OnlineFineTuningOrchestrationService>();

        FineTuningOptions fineTuningOptions = new();
        configuration.GetSection(FineTuningOptions.SectionPath).Bind(fineTuningOptions);

        if (fineTuningOptions.Enabled && !string.IsNullOrWhiteSpace(fineTuningOptions.BaseModelDeploymentName))
        {
            services.AddSingleton<IFineTuningJobOrchestrator, AzureOpenAiFineTuningJobOrchestrator>();
        }
        else
        {
            services.AddSingleton<IFineTuningJobOrchestrator, DisabledFineTuningJobOrchestrator>();
        }

        services.AddSingleton<InMemoryFineTunedModelRegistry>();
        services.AddSingleton<IFineTunedModelRegistry>(static sp =>
        {
            InMemoryFineTunedModelRegistry inner = sp.GetRequiredService<InMemoryFineTunedModelRegistry>();
            AzureOpenAiCompletionClientCache completionClientCache =
                sp.GetRequiredService<AzureOpenAiCompletionClientCache>();

            return new CacheInvalidatingFineTunedModelRegistry(inner, completionClientCache);
        });
        services.AddScoped<IAgentCompletionDeploymentResolver, FineTunedAgentCompletionDeploymentResolver>();
    }
}
