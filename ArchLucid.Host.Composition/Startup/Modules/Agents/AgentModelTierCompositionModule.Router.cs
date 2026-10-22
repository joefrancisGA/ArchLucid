using ArchLucid.AgentRuntime.AgentModelAliases;
using ArchLucid.AgentRuntime.FineTuning;
using ArchLucid.AgentRuntime;
using ArchLucid.Core.Agents;
using ArchLucid.Core.AiProviders;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Resilience;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Composition.AzureOpenAI;
using ArchLucid.Host.Core.Resilience;
using ArchLucid.Host.Core.Startup;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

using IAgentCompletionClient = ArchLucid.AgentRuntime.IAgentCompletionClient;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

partial class AgentModelTierCompositionModule
{
    /// <summary>
    ///     Registers a pass-through tier router when completion pipeline registrars have not yet run.
    ///     Later <see cref="RegisterPassThroughTierCompletionRouter" /> or
    ///     <see cref="RegisterTieredAzureCompletionRouter" /> registrations win at resolution time.
    /// </summary>
    public static void EnsureBaselineTierCompletionRouter(IServiceCollection services)
    {
        FakeAgentCompletionPipelineRegistrar.TryRegisterBaselineScopedInnerClient(services);

        services.TryAddScoped<IAgentTierCompletionRouter>(static sp =>
        {
            ScopedInnerAgentCompletionClient innerHolder = sp.GetRequiredService<ScopedInnerAgentCompletionClient>();
            IAgentModelTierResolver resolver = sp.GetRequiredService<IAgentModelTierResolver>();
            IAgentModelAliasResolver aliasResolver = sp.GetRequiredService<IAgentModelAliasResolver>();

            return new PassThroughAgentTierCompletionRouter(innerHolder.Inner, resolver, aliasResolver);
        });

        services.TryAddScoped<IAgentCompletionClient>(static sp =>
            sp.GetRequiredService<IAgentTierCompletionRouter>().DefaultCompletionClient);
    }

    public static void RegisterPassThroughTierCompletionRouter(IServiceCollection services)
    {
        services.AddScoped<IAgentTierCompletionRouter>(static sp =>
        {
            ScopedInnerAgentCompletionClient innerHolder = sp.GetRequiredService<ScopedInnerAgentCompletionClient>();
            IAgentModelTierResolver resolver = sp.GetRequiredService<IAgentModelTierResolver>();
            IAgentModelAliasResolver aliasResolver = sp.GetRequiredService<IAgentModelAliasResolver>();

            return new PassThroughAgentTierCompletionRouter(innerHolder.Inner, resolver, aliasResolver);
        });
    }

    public static void RegisterTieredAzureCompletionRouter(IServiceCollection services)
    {
        RegisterTenantAzureOpenAiCompletionClientFactory(services);

        services.AddScoped<IAgentTierCompletionRouter>(sp =>
        {
            IAgentModelTierResolver resolver = sp.GetRequiredService<IAgentModelTierResolver>();
            IAgentModelAliasResolver aliasResolver = sp.GetRequiredService<IAgentModelAliasResolver>();
            ScopedInnerAgentCompletionClient primaryHolder = sp.GetRequiredService<ScopedInnerAgentCompletionClient>();
            AzureOpenAiCompletionClientCache clientCache = sp.GetRequiredService<AzureOpenAiCompletionClientCache>();
            CircuitBreakerGate primaryGate =
                sp.GetRequiredKeyedService<CircuitBreakerGate>(OpenAiCircuitBreakerKeys.Completion);
            IConfiguration config = sp.GetRequiredService<IConfiguration>();
            string primaryDeployment = config["AzureOpenAI:DeploymentName"]?.Trim()
                                       ?? throw new InvalidOperationException("AzureOpenAI:DeploymentName is missing.");
            IAgentCompletionDeploymentResolver deploymentResolver =
                sp.GetRequiredService<IAgentCompletionDeploymentResolver>();
            Guid tenantId = sp.GetRequiredService<IScopeContextProvider>().GetCurrentScope().TenantId;
            ITenantAzureOpenAiCompletionClientFactory tenantFactory =
                sp.GetRequiredService<ITenantAzureOpenAiCompletionClientFactory>();
            ITenantAzureOpenAiConnectionRepository tenantConnectionRepository =
                sp.GetRequiredService<ITenantAzureOpenAiConnectionRepository>();

            string ResolveEffectiveDeployment(string tierDeployment)
            {
                return deploymentResolver
                    .ResolveDeploymentNameAsync(tenantId, tierDeployment, CancellationToken.None)
                    .ConfigureAwait(false)
                    .GetAwaiter()
                    .GetResult();
            }

            return new TieredAgentCompletionRouter(
                resolver,
                tier => ResolveTierCompletionClient(
                    sp,
                    tier,
                    resolver,
                    tenantId,
                    tenantFactory,
                    tenantConnectionRepository,
                    primaryHolder,
                    primaryGate,
                    primaryDeployment,
                    clientCache,
                    ResolveEffectiveDeployment),
                primaryHolder.Inner,
                aliasResolver);
        });
    }

    public static void RegisterAgentCompletionClientFromTierRouter(IServiceCollection services)
    {
        services.AddScoped<IAgentCompletionClient>(static sp =>
            sp.GetRequiredService<IAgentTierCompletionRouter>().DefaultCompletionClient);

        services.AddScoped<ILlmProviderFactory>(static sp =>
            new DefaultLlmProviderFactory(sp.GetRequiredService<IAgentCompletionClient>()));
    }
}
