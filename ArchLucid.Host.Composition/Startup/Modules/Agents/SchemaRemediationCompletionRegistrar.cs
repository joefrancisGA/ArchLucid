using ArchLucid.AgentRuntime.AgentModelAliases;
using ArchLucid.AgentRuntime.FineTuning;
using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Composition.AzureOpenAI;
using IAgentCompletionClient = ArchLucid.AgentRuntime.IAgentCompletionClient;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

internal static class SchemaRemediationCompletionRegistrar
{
    internal static void RegisterSchemaRemediationAgentCompletionClient(IServiceCollection services, bool useAzureOpenAi)
    {
        services.AddScoped<ISchemaRemediationAgentCompletionClient>(sp =>
        {
            if (useAzureOpenAi)
            {
                IAgentModelTierResolver resolver = sp.GetRequiredService<IAgentModelTierResolver>();
                IAgentModelAliasResolver aliasResolver = sp.GetRequiredService<IAgentModelAliasResolver>();
                string deployment = resolver.ResolveDeploymentName(LlmModelTier.Economy);
                AzureOpenAiCompletionClientCache clientCache = sp.GetRequiredService<AzureOpenAiCompletionClientCache>();
                IAgentCompletionDeploymentResolver deploymentResolver =
                    sp.GetRequiredService<IAgentCompletionDeploymentResolver>();
                Guid tenantId = sp.GetRequiredService<IScopeContextProvider>().GetCurrentScope().TenantId;
                string effectiveDeployment = deploymentResolver
                    .ResolveDeploymentNameAsync(tenantId, deployment, CancellationToken.None)
                    .ConfigureAwait(false)
                    .GetAwaiter()
                    .GetResult();
                AzureOpenAiCompletionClient azureInner = clientCache.GetOrAdd(effectiveDeployment);
                IAgentCompletionClient client =
                    AgentCompletionPipelineHelpers.BuildAzureOpenAiScopedCompletionChainWithoutPollyRetry(
                        sp,
                        azureInner,
                        effectiveDeployment);

                return new SchemaRemediationAgentCompletionClientAdapter(client, aliasResolver);
            }

            IAgentTierCompletionRouter router = sp.GetRequiredService<IAgentTierCompletionRouter>();
            IAgentModelAliasResolver passThroughAliasResolver = sp.GetRequiredService<IAgentModelAliasResolver>();
            (IAgentCompletionClient remediation, _) =
                router.ResolveForAgent(AgentType.Topology, LlmModelTier.Economy);

            return new SchemaRemediationAgentCompletionClientAdapter(remediation, passThroughAliasResolver);
        });
    }
}
