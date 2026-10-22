using ArchLucid.AgentRuntime;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Resilience;
using ArchLucid.Core.Retrieval;
using ArchLucid.Host.Composition.AzureOpenAI;
using ArchLucid.Host.Composition.Caching;
using ArchLucid.Host.Composition.Startup.Modules;
using ArchLucid.Host.Core.Resilience;
using ArchLucid.Host.Core.Startup;
using ArchLucid.Retrieval.Agentic;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.Graph;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Queries;
using ArchLucid.Retrieval.Summarization;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Polly;

namespace ArchLucid.Host.Composition.Startup.Modules;

partial class RetrievalCompositionModule
{
    private static void RegisterAgents(IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IManifestChunkSummaryCompletionClient, ManifestChunkSummaryCompletionClient>();
        services.AddScoped<IManifestChunkSummarizer, ManifestChunkSummarizer>();
        services.AddScoped<IAgenticRetrievalCompletionClient, AgenticRetrievalCompletionClient>();
        services.AddScoped<IAgenticRetrievalQueryExpander, AgenticRetrievalQueryExpander>();
        services.AddScoped<IGraphCommunitySummaryCompletionClient, GraphCommunitySummaryCompletionClient>();
        services.AddScoped<IGraphCommunitySummarizationService, GraphCommunitySummarizationService>();
        services.AddScoped<IGraphCommunitySummaryLookup, GraphCommunitySummaryLookup>();

        services.AddSingleton<IEmbeddingModelIdentity, ConfiguredEmbeddingModelIdentity>();
        services.AddHostedService<RetrievalEmbeddingDriftStartupValidator>();

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
                (sp, _) => AgentCompositionModule.CreateOpenAiCircuitBreakerGate(sp, OpenAiCircuitBreakerKeys.Embedding));

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
                    sp.GetRequiredService<IOptionsMonitor<EmbeddingContentHashCacheOptions>>(),
                    sp.GetRequiredService<IEmbeddingModelIdentity>());
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
                    sp.GetRequiredService<IOptionsMonitor<EmbeddingContentHashCacheOptions>>(),
                    sp.GetRequiredService<IEmbeddingModelIdentity>());
            });
        }
    }
}
