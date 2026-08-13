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
using ArchLucid.Application.Agents;
using ArchLucid.Application.Budgeting;
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

    private static void RegisterAgentModelTierOrchestration(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<AgentModelTierOptions>(configuration.GetSection(AgentModelTierOptions.SectionPath));
        services.PostConfigure<AgentModelTierOptions>(static opts => AgentModelTierDefaults.ApplyDefaults(opts));
        services.AddSingleton<IAgentModelTierResolver, AgentModelTierResolver>();
        services.AddSingleton<CatalogBackedAgentModelAliasRegistry>();
        services.AddSingleton<IAgentModelAliasRegistry>(static sp =>
            sp.GetRequiredService<CatalogBackedAgentModelAliasRegistry>());
        services.AddSingleton<IAgentModelCatalogCacheInvalidator>(static sp =>
            sp.GetRequiredService<CatalogBackedAgentModelAliasRegistry>());
        services.AddSingleton<AgentModelCatalogBootstrapper>();
        services.AddSingleton<IAgentModelAliasResolver, AgentModelAliasResolver>();
    }

    private static void RegisterPassThroughTierCompletionRouter(IServiceCollection services)
    {
        services.AddScoped<IAgentTierCompletionRouter>(static sp =>
        {
            ScopedInnerAgentCompletionClient innerHolder = sp.GetRequiredService<ScopedInnerAgentCompletionClient>();
            IAgentModelTierResolver resolver = sp.GetRequiredService<IAgentModelTierResolver>();
            IAgentModelAliasResolver aliasResolver = sp.GetRequiredService<IAgentModelAliasResolver>();

            return new PassThroughAgentTierCompletionRouter(innerHolder.Inner, resolver, aliasResolver);
        });
    }

    private static void RegisterTieredAzureCompletionRouter(IServiceCollection services)
    {
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
                tier =>
                {
                    string tierDeployment = resolver.ResolveDeploymentName(tier);
                    string effectiveDeployment = ResolveEffectiveDeployment(tierDeployment);
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

                    return BuildAzureOpenAiScopedCompletionChain(sp, azureInner, primaryGate, effectiveDeployment);
                },
                primaryHolder.Inner,
                aliasResolver);
        });
    }

    private static void RegisterAgentCompletionClientFromTierRouter(IServiceCollection services)
    {
        services.AddScoped<IAgentCompletionClient>(static sp =>
            sp.GetRequiredService<IAgentTierCompletionRouter>().DefaultCompletionClient);

        services.AddScoped<ILlmProviderFactory>(static sp =>
            new DefaultLlmProviderFactory(sp.GetRequiredService<IAgentCompletionClient>()));
    }
}
