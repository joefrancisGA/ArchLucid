using ArchLucid.AgentRuntime.Tokens;
using ArchLucid.AgentRuntime;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Resilience;
using ArchLucid.Host.Composition.AzureOpenAI;
using ArchLucid.Host.Core.Resilience;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

partial class AgentAzureOpenAiExecutorRegistrar
{
    private static void RegisterCircuitBreakers(
        IServiceCollection services,
        IConfiguration configuration,
        bool fallbackLlmEnabled)
    {
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
                ILlmCompletionOutputTruncationReporter truncationReporter =
                    sp.GetRequiredService<ILlmCompletionOutputTruncationReporter>();

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
                            llmTelemetryOptions,
                            truncationReporter));
                }

                return new FallbackAzureOpenAiInnerClientsRegistry { Clients = clients };
            });
        }
    }
}
