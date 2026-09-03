using ArchLucid.AgentRuntime.FineTuning;
using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;
using ArchLucid.Core.AiProviders;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Resilience;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Composition.AzureOpenAI;
using ArchLucid.Host.Core.Resilience;
using ArchLucid.Host.Core.Startup;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.DependencyInjection;

using IAgentCompletionClient = ArchLucid.AgentRuntime.IAgentCompletionClient;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

partial class AgentModelTierCompositionModule
{
    private static void RegisterTenantAzureOpenAiCompletionClientFactory(IServiceCollection services)
    {
        services.AddScoped<ITenantAzureOpenAiCompletionClientFactory, TenantAzureOpenAiCompletionClientFactory>();
    }

    private static IAgentCompletionClient ResolveTierCompletionClient(
        IServiceProvider sp,
        LlmModelTier tier,
        IAgentModelTierResolver resolver,
        Guid tenantId,
        ITenantAzureOpenAiCompletionClientFactory tenantFactory,
        ITenantAzureOpenAiConnectionRepository tenantConnectionRepository,
        ScopedInnerAgentCompletionClient primaryHolder,
        CircuitBreakerGate primaryGate,
        string primaryDeployment,
        AzureOpenAiCompletionClientCache clientCache,
        Func<string, string> resolveEffectiveDeployment)
    {
        string tierDeployment = resolver.ResolveDeploymentName(tier);

        AzureOpenAiCompletionClient? tenantClient = tenantFactory
            .TryCreateAsync(tenantId, tierDeployment, CancellationToken.None)
            .ConfigureAwait(false)
            .GetAwaiter()
            .GetResult();

        if (tenantClient is not null)
        {
            TenantAzureOpenAiConnectionRecord? tenantConnection = tenantConnectionRepository
                .GetAsync(tenantId, CancellationToken.None)
                .ConfigureAwait(false)
                .GetAwaiter()
                .GetResult();

            string tenantDeployment = tenantConnection is not null
                ? TenantAzureOpenAiDeploymentsCatalog.ResolveDeploymentName(
                    tenantConnection.DeploymentsJson,
                    tierDeployment)
                : tierDeployment;

            return AgentCompletionPipelineHelpers.BuildAzureOpenAiScopedCompletionChain(
                sp,
                tenantClient,
                primaryGate,
                tenantDeployment);
        }

        string effectiveDeployment = resolveEffectiveDeployment(tierDeployment);
        bool isPrimaryTierDeployment = string.Equals(
            tierDeployment,
            primaryDeployment,
            StringComparison.OrdinalIgnoreCase);
        bool fineTunedOverride = !string.Equals(
            effectiveDeployment,
            tierDeployment,
            StringComparison.OrdinalIgnoreCase);

        if (isPrimaryTierDeployment && !fineTunedOverride)
        {
            return primaryHolder.Inner;
        }

        AzureOpenAiCompletionClient azureInner = clientCache.GetOrAdd(effectiveDeployment);

        return AgentCompletionPipelineHelpers.BuildAzureOpenAiScopedCompletionChain(
            sp,
            azureInner,
            primaryGate,
            effectiveDeployment);
    }
}
