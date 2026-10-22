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

partial class AgentAzureOpenAiExecutorRegistrar
{
    private static void RegisterScopedCompletionChain(
        IServiceCollection services,
        IConfiguration configuration,
        bool fallbackLlmEnabled)
    {
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
    }

    private static void RegisterTierRouter(IServiceCollection services)
    {
        AgentModelTierCompositionModule.RegisterTieredAzureCompletionRouter(services);
        AgentCompletionPipelineCompositionModule.RegisterSchemaRemediationClient(services, useAzureOpenAi: true);
        AgentModelTierCompositionModule.RegisterAgentCompletionClientFromTierRouter(services);
    }
}
