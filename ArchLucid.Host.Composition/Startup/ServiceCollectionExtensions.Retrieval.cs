using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.AgentModelAliases;
using ArchLucid.AgentRuntime.Batch;
using ArchLucid.AgentRuntime.Caching;
using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.AgentRuntime.Evaluation.ReferenceCases;
using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.AgentRuntime.Prompts.Variants;
using ArchLucid.AgentRuntime.Tokens;
using ArchLucid.Contracts.Persistence.Agents.PromptVariants;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.AgentRuntime.QuickScan;
using ArchLucid.AgentRuntime.Safety;
using ArchLucid.AgentSimulator.Services;
using ArchLucid.Core.AgentSimulation;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Core.Evidence;
using ArchLucid.AgentRuntime.PromptInjection;
using ArchLucid.Application.Agents.IaC;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Agents;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Http;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Llm.Redaction;
using IAgentCompletionClient = ArchLucid.AgentRuntime.IAgentCompletionClient;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Resilience;
using ArchLucid.Core.Safety;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Validation;
using ArchLucid.Host.Composition.AzureOpenAI;
using ArchLucid.Host.Composition.Caching;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Diagnostics;
using ArchLucid.Host.Core.Http;
using ArchLucid.Host.Core.Resilience;
using ArchLucid.Host.Core.Services;
using ArchLucid.Host.Core.Startup;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Coordination.Caching;
using ArchLucid.Core.Admin;
using ArchLucid.Retrieval.Admin;
using ArchLucid.Retrieval.Agentic;
using ArchLucid.Retrieval.Chunking;
using ArchLucid.Retrieval.Citations;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.Graph;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.PolicyPacks;
using ArchLucid.Retrieval.Reranking;
using ArchLucid.Retrieval.Summarization;
using ArchLucid.Retrieval.Pricing;
using ArchLucid.Retrieval.Queries;
using ArchLucid.Retrieval.FineTuning;
using ArchLucid.Retrieval.FineTuning.Consent;
using ArchLucid.Retrieval.FineTuning.Evaluation;
using ArchLucid.Retrieval.FineTuning.Export;
using ArchLucid.Retrieval.FineTuning.Orchestration;
using ArchLucid.Retrieval.FineTuning.Redaction;
using ArchLucid.Retrieval.FineTuning.Registry;
using ArchLucid.AgentRuntime.FineTuning;

using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

using Polly;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static void RegisterRetrieval(IServiceCollection services, IConfiguration configuration)
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

        services.AddSingleton<PassThroughRetrievalReranker>();
        services.AddSingleton<LexicalOverlapRetrievalReranker>();
        services.AddSingleton<IRetrievalReranker, AzureAiSearchSemanticRetrievalReranker>();

        services.AddSingleton<SimpleTextChunker>();
        services.AddSingleton<ITextChunker>(static sp => sp.GetRequiredService<SimpleTextChunker>());
        services.AddSingleton<PolicyPackChunker>();
        services.AddSingleton<PriorManifestChunker>();
        services.AddScoped<IRetrievalDocumentBuilder, RetrievalDocumentBuilder>();
        services.AddSingleton<IRetrievalDocumentIndexCatalog, InMemoryRetrievalDocumentIndexCatalog>();
        services.AddScoped<IAdminRagHealthQuery, AdminRagHealthQuery>();
        services.AddScoped<IRetrievalIndexingService, RetrievalIndexingService>();
        services.AddScoped<AssignedPolicyPackRulePackIdResolver>();
        services.AddSingleton<IRetrievalCitationFormatter, RetrievalCitationFormatter>();
        services.AddScoped<IManifestChunkSummaryCompletionClient, ManifestChunkSummaryCompletionClient>();
        services.AddScoped<IManifestChunkSummarizer, ManifestChunkSummarizer>();
        services.AddScoped<IAgenticRetrievalCompletionClient, AgenticRetrievalCompletionClient>();
        services.AddScoped<IAgenticRetrievalQueryExpander, AgenticRetrievalQueryExpander>();
        services.AddScoped<IGraphRagNeighborExpander, GraphRagNeighborExpander>();
        services.AddScoped<IRetrievalQueryService, RetrievalQueryService>();
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

        services.AddSingleton<IEmbeddingModelIdentity, ConfiguredEmbeddingModelIdentity>();
        services.AddHostedService<RetrievalEmbeddingDriftStartupValidator>();

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

        string? embedDeployment = configuration["AzureOpenAI:EmbeddingDeploymentName"];
        string? endpoint = configuration["AzureOpenAI:Endpoint"];
        bool useManagedIdentityEmbeddings = AzureOpenAiConfigurationProbe.UsesManagedIdentity(configuration);
        string? apiKey = configuration["AzureOpenAI:ApiKey"];
        bool useAzureEmbeddings = AzureOpenAiConfigurationProbe.IsEmbeddingsStackConfigured(configuration);

        if (useAzureEmbeddings)
        {
            services.PostConfigure<RetrievalEmbeddingModelOptions>(options =>
            {
                options.ModelId = embedDeployment!.Trim();

                if (options.ExpectedDimension <= 0)
                    options.ExpectedDimension = 1536;
            });

            services.AddKeyedSingleton<CircuitBreakerGate>(
                OpenAiCircuitBreakerKeys.Embedding,
                (sp, _) => CreateOpenAiCircuitBreakerGate(sp, OpenAiCircuitBreakerKeys.Embedding));

            services.AddSingleton<IOpenAiEmbeddingClient>(sp =>
            {
                IOptionsMonitor<LlmTelemetryOptions> llmTelemetryOptions =
                    sp.GetRequiredService<IOptionsMonitor<LlmTelemetryOptions>>();
                TimeSpan embeddingNetworkTimeout = sp
                    .GetRequiredService<IOptionsMonitor<RetrievalQueryBudgetOptions>>()
                    .CurrentValue
                    .GetEffectiveEmbeddingNetworkTimeout();
                AzureOpenAiEmbeddingClient inner = useManagedIdentityEmbeddings
                    ? AzureOpenAiEmbeddingClient.CreateWithManagedIdentity(
                        endpoint!,
                        embedDeployment!,
                        llmTelemetryOptions,
                        embeddingNetworkTimeout)
                    : new AzureOpenAiEmbeddingClient(
                        endpoint!,
                        apiKey!,
                        embedDeployment!,
                        llmTelemetryOptions,
                        embeddingNetworkTimeout);
                CircuitBreakerGate gate = sp.GetRequiredKeyedService<CircuitBreakerGate>(OpenAiCircuitBreakerKeys.Embedding);
                ILogger<CircuitBreakingOpenAiEmbeddingClient> logger =
                    sp.GetRequiredService<ILogger<CircuitBreakingOpenAiEmbeddingClient>>();
                AgentExecutionResilienceOptions resOpts =
                    sp.GetRequiredService<IOptions<AgentExecutionResilienceOptions>>().Value;
                resOpts.Normalize();
                ResiliencePipeline embeddingRetry = LlmCallResilienceDefaults.BuildLlmRetryPipeline(
                    logger: logger,
                    maxRetryAttempts: resOpts.LlmCallMaxRetryAttempts,
                    baseDelay: TimeSpan.FromMilliseconds(resOpts.LlmCallBaseDelayMilliseconds),
                    maxDelay: TimeSpan.FromSeconds(resOpts.LlmCallMaxDelaySeconds),
                    gateName: OpenAiCircuitBreakerKeys.Embedding);

                return new CircuitBreakingOpenAiEmbeddingClient(inner, gate, embeddingRetry, logger);
            });
            services.Configure<EmbeddingContentHashCacheOptions>(
                configuration.GetSection(EmbeddingContentHashCacheOptions.SectionPath));
            services.AddSingleton<AzureOpenAiEmbeddingService>();
            services.AddSingleton<IEmbeddingService>(static sp =>
            {
                AzureOpenAiEmbeddingService inner = sp.GetRequiredService<AzureOpenAiEmbeddingService>();

                return new CachingEmbeddingService(
                    inner,
                    sp.GetRequiredService<IMemoryCache>(),
                    sp.GetRequiredService<IOptionsMonitor<EmbeddingContentHashCacheOptions>>());
            });
        }
        else
        {
            services.PostConfigure<RetrievalEmbeddingModelOptions>(options =>
            {
                options.ModelId = "fake-local";
                options.ExpectedDimension = 32;
            });

            services.Configure<EmbeddingContentHashCacheOptions>(
                configuration.GetSection(EmbeddingContentHashCacheOptions.SectionPath));
            services.AddSingleton<FakeEmbeddingService>();
            services.AddSingleton<IEmbeddingService>(static sp =>
            {
                FakeEmbeddingService inner = sp.GetRequiredService<FakeEmbeddingService>();

                return new CachingEmbeddingService(
                    inner,
                    sp.GetRequiredService<IMemoryCache>(),
                    sp.GetRequiredService<IOptionsMonitor<EmbeddingContentHashCacheOptions>>());
            });
        }

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
