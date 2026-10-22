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
                IReadOnlyList<FallbackLlmResolvedEndpoint> ordered =
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

                foreach (FallbackLlmResolvedEndpoint row in ordered)
                {
                    clients.Add(CreateFallbackInnerClient(
                        row,
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

    private static AzureOpenAiCompletionClient CreateFallbackInnerClient(
        FallbackLlmResolvedEndpoint row,
        int maxTokens,
        BinaryData? schema,
        ILogger<AzureOpenAiCompletionClient> completionLogger,
        IOptionsMonitor<LlmTelemetryOptions> llmTelemetryOptions,
        ILlmCompletionOutputTruncationReporter truncationReporter)
    {
        ArgumentNullException.ThrowIfNull(row);

        if (row.UseManagedIdentity)
        {
            return AzureOpenAiCompletionClient.CreateWithManagedIdentity(
                row.Endpoint,
                row.DeploymentName,
                maxTokens,
                schema,
                completionLogger,
                llmTelemetryOptions,
                truncationReporter);
        }

        return new AzureOpenAiCompletionClient(
            row.Endpoint,
            row.ApiKey,
            row.DeploymentName,
            maxTokens,
            schema,
            completionLogger,
            llmTelemetryOptions,
            truncationReporter);
    }
}
