// Azure OpenAI completion-client agent executor registrations (extracted from AgentExecutionCompositionModule).

using ArchLucid.AgentRuntime.Tokens;
using ArchLucid.AgentRuntime;
using ArchLucid.Application.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Resilience;
using ArchLucid.Host.Composition.AzureOpenAI;
using ArchLucid.Host.Core.Resilience;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

using IAgentCompletionClient = ArchLucid.AgentRuntime.IAgentCompletionClient;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

/// <summary>
///     Azure OpenAI completion pipeline, circuit breakers, and tier router for real-mode agent execution.
/// </summary>
internal static class AgentAzureOpenAiExecutorRegistrar
{
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
        FallbackLlmOptions fallbackOpts =
            configuration.GetSection(FallbackLlmOptions.SectionName).Get<FallbackLlmOptions>()
            ?? new FallbackLlmOptions();

        bool fallbackLlmEnabled = fallbackOpts.Enabled;

        if (fallbackLlmEnabled)
            _ = FallbackLlmConfigurationResolver.ResolveOrderedEndpoints(fallbackOpts);

        services.AddKeyedSingleton<CircuitBreakerGate>(
            OpenAiCircuitBreakerKeys.Completion,
            (sp, _) => AzureOpenAiCircuitBreakerCompositionModule.CreateOpenAiCircuitBreakerGate(sp, OpenAiCircuitBreakerKeys.Completion));

        if (fallbackLlmEnabled)
        {
            services.AddKeyedSingleton<CircuitBreakerGate>(
                OpenAiCircuitBreakerKeys.CompletionFallback,
                (sp, _) => AzureOpenAiCircuitBreakerCompositionModule.CreateOpenAiCircuitBreakerGate(sp, OpenAiCircuitBreakerKeys.CompletionFallback));

            services.AddSingleton<FallbackAzureOpenAiInnerClientsRegistry>(sp =>
            {
                FallbackLlmOptions fo = sp.GetRequiredService<IOptions<FallbackLlmOptions>>().Value;
                IReadOnlyList<(string Endpoint, string ApiKey, string DeploymentName)> ordered =
                    FallbackLlmConfigurationResolver.ResolveOrderedEndpoints(fo);
                IConfiguration cfg = sp.GetRequiredService<IConfiguration>();
                int maxTokens = cfg.GetValue("AzureOpenAI:MaxCompletionTokens", 0);

                if (maxTokens <= 0)

                    maxTokens = AzureOpenAiCompletionClient.DefaultMaxCompletionTokens;


                AzureOpenAiOptions ao = sp.GetRequiredService<IOptions<AzureOpenAiOptions>>().Value;
                BinaryData? schema = AgentCompletionPipelineHelpers.ResolveStructuredOutputAgentResultSchema(cfg, ao);
                ILogger<AzureOpenAiCompletionClient> completionLogger =
                    sp.GetRequiredService<ILogger<AzureOpenAiCompletionClient>>();

                List<AzureOpenAiCompletionClient> clients = new(ordered.Count);

                IOptionsMonitor<LlmTelemetryOptions> llmTelemetryOptions =
                    sp.GetRequiredService<IOptionsMonitor<LlmTelemetryOptions>>();

                foreach ((string ep, string key, string dep) in ordered)
                {
                    clients.Add(
                        new AzureOpenAiCompletionClient(
                            ep,
                            key,
                            dep,
                            maxTokens,
                            schema,
                            completionLogger,
                            llmTelemetryOptions));
                }

                return new FallbackAzureOpenAiInnerClientsRegistry { Clients = clients };
            });
        }

        services.AddSingleton<AzureOpenAiCompletionClientCache>(sp =>
        {
            IConfiguration config = sp.GetRequiredService<IConfiguration>();
            string endpoint = config["AzureOpenAI:Endpoint"]
                              ?? throw new InvalidOperationException("AzureOpenAI:Endpoint is missing.");
            string? apiKey = config["AzureOpenAI:ApiKey"];
            string authenticationMode = config["AzureOpenAI:AuthenticationMode"]?.Trim() ?? "ApiKey";
            int maxTokens = config.GetValue("AzureOpenAI:MaxCompletionTokens", 0);

            if (maxTokens <= 0)

                maxTokens = AzureOpenAiCompletionClient.DefaultMaxCompletionTokens;


            AzureOpenAiOptions ao = sp.GetRequiredService<IOptions<AzureOpenAiOptions>>().Value;
            BinaryData? schema = AgentCompletionPipelineHelpers.ResolveStructuredOutputAgentResultSchema(config, ao);
            ILogger<AzureOpenAiCompletionClient> completionLogger =
                sp.GetRequiredService<ILogger<AzureOpenAiCompletionClient>>();
            IOptionsMonitor<LlmTelemetryOptions> llmTelemetryOptions =
                sp.GetRequiredService<IOptionsMonitor<LlmTelemetryOptions>>();

            bool useManagedIdentity =
                string.Equals(authenticationMode, "ManagedIdentity", StringComparison.OrdinalIgnoreCase);

            return new AzureOpenAiCompletionClientCache(deploymentName =>
            {
                if (useManagedIdentity)
                {
                    return AzureOpenAiCompletionClient.CreateWithManagedIdentity(
                        endpoint,
                        deploymentName,
                        maxTokens,
                        schema,
                        completionLogger,
                        llmTelemetryOptions);
                }

                if (string.IsNullOrWhiteSpace(apiKey))
                {
                    throw new InvalidOperationException(
                        "AzureOpenAI:ApiKey is missing while AuthenticationMode is ApiKey.");
                }

                return new AzureOpenAiCompletionClient(
                    endpoint,
                    apiKey,
                    deploymentName,
                    maxTokens,
                    schema,
                    completionLogger,
                    llmTelemetryOptions);
            });
        });

        services.AddSingleton<AzureOpenAiCompletionClient>(sp =>
        {
            IConfiguration config = sp.GetRequiredService<IConfiguration>();
            string endpoint = config["AzureOpenAI:Endpoint"]
                              ?? throw new InvalidOperationException("AzureOpenAI:Endpoint is missing.");
            string? apiKey = config["AzureOpenAI:ApiKey"];
            string authenticationMode = config["AzureOpenAI:AuthenticationMode"]?.Trim() ?? "ApiKey";
            string deploymentName = config["AzureOpenAI:DeploymentName"]
                                    ?? throw new InvalidOperationException("AzureOpenAI:DeploymentName is missing.");
            int maxTokens = config.GetValue("AzureOpenAI:MaxCompletionTokens", 0);

            if (maxTokens <= 0)

                maxTokens = AzureOpenAiCompletionClient.DefaultMaxCompletionTokens;


            AzureOpenAiOptions ao = sp.GetRequiredService<IOptions<AzureOpenAiOptions>>().Value;
            BinaryData? schema = AgentCompletionPipelineHelpers.ResolveStructuredOutputAgentResultSchema(config, ao);
            ILogger<AzureOpenAiCompletionClient> completionLogger =
                sp.GetRequiredService<ILogger<AzureOpenAiCompletionClient>>();
            IOptionsMonitor<LlmTelemetryOptions> llmTelemetryOptions =
                sp.GetRequiredService<IOptionsMonitor<LlmTelemetryOptions>>();

            if (string.Equals(authenticationMode, "ManagedIdentity", StringComparison.OrdinalIgnoreCase))
            {
                return AzureOpenAiCompletionClient.CreateWithManagedIdentity(
                    endpoint,
                    deploymentName,
                    maxTokens,
                    schema,
                    completionLogger,
                    llmTelemetryOptions);
            }

            if (string.IsNullOrWhiteSpace(apiKey))
                throw new InvalidOperationException("AzureOpenAI:ApiKey is missing.");

            return new AzureOpenAiCompletionClient(
                endpoint,
                apiKey,
                deploymentName,
                maxTokens,
                schema,
                completionLogger,
                llmTelemetryOptions);
        });

        services.AddSingleton<LlmTokenQuotaWindowTracker>();
        services.AddScoped<LlmCompletionAccountingTelemetry>();

        services.AddKeyedScoped<IAgentCompletionClient>(
            AgentOutputLlmJudgeCompletionServiceKey.Value,
            static (sp, _) => AgentCompletionPipelineHelpers.BuildAgentOutputSemanticJudgeCompletionChain(sp));

        services.AddScoped<ScopedInnerAgentCompletionClient>(sp =>
        {
            AzureOpenAiCompletionClient azureInner = sp.GetRequiredService<AzureOpenAiCompletionClient>();
            IConfiguration config = sp.GetRequiredService<IConfiguration>();
            string primaryDeployment = config["AzureOpenAI:DeploymentName"]
                ?? throw new InvalidOperationException("AzureOpenAI:DeploymentName is missing.");
            CircuitBreakerGate primaryGate =
                sp.GetRequiredKeyedService<CircuitBreakerGate>(OpenAiCircuitBreakerKeys.Completion);

            IAgentCompletionClient primaryChain = AgentCompletionPipelineHelpers.BuildAzureOpenAiScopedCompletionChain(
                sp,
                azureInner,
                primaryGate,
                primaryDeployment);

            if (!fallbackLlmEnabled)
            {
                IAgentCompletionClient guarded = new CostGuardrailInterceptor(
                    primaryChain,
                    sp.GetRequiredService<IOptions<AgentOutputQualityGateOptions>>(),
                    sp.GetRequiredService<ILlmCostEstimator>());

                return new ScopedInnerAgentCompletionClient(guarded);
            }


            FallbackAzureOpenAiInnerClientsRegistry registry =
                sp.GetRequiredService<FallbackAzureOpenAiInnerClientsRegistry>();
            CircuitBreakerGate fallbackGate =
                sp.GetRequiredKeyedService<CircuitBreakerGate>(OpenAiCircuitBreakerKeys.CompletionFallback);

            List<IAgentCompletionClient> secondaryChains = new(registry.Clients.Count);
            secondaryChains.AddRange(registry.Clients.Select(fbInner => AgentCompletionPipelineHelpers.BuildAzureOpenAiScopedCompletionChain(sp, fbInner, fallbackGate, fbInner.Descriptor.ModelId)));

            ILogger<FallbackAgentCompletionClient> fallbackLogger =
                sp.GetRequiredService<ILogger<FallbackAgentCompletionClient>>();

            IAgentCompletionClient finalClient = new FallbackAgentCompletionClient(
                primaryChain,
                secondaryChains,
                fallbackLogger);

            IAgentCompletionClient guardedFinal = new CostGuardrailInterceptor(
                finalClient,
                sp.GetRequiredService<IOptions<AgentOutputQualityGateOptions>>(),
                sp.GetRequiredService<ILlmCostEstimator>());

            return new ScopedInnerAgentCompletionClient(guardedFinal);
        });

        AgentModelTierCompositionModule.RegisterTieredAzureCompletionRouter(services);
        AgentCompletionPipelineCompositionModule.RegisterSchemaRemediationClient(services, useAzureOpenAi: true);
        AgentModelTierCompositionModule.RegisterAgentCompletionClientFromTierRouter(services);
    }
}
