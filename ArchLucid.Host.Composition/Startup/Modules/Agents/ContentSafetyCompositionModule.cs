// Agent bounded-context composition registrations (extracted from ServiceCollectionExtensions.Agents* partials).

using ArchLucid.AgentRuntime.AgentModelAliases;
using ArchLucid.AgentRuntime.Batch;
using ArchLucid.AgentRuntime.Caching;
using ArchLucid.AgentRuntime.Evaluation.ReferenceCases;
using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.AgentRuntime.FineTuning;
using ArchLucid.AgentRuntime.PromptInjection;
using ArchLucid.AgentRuntime.Prompts.Variants;
using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.AgentRuntime.QuickScan;
using ArchLucid.AgentRuntime.Safety;
using ArchLucid.AgentRuntime.Tokens;
using ArchLucid.AgentRuntime;
using ArchLucid.AgentSimulator.Services;
using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Application.Agents.IaC;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Agents.PromptVariants;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Admin;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.AgentSimulation;
using ArchLucid.Core.Agents;
using ArchLucid.Core.AiProviders;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Evidence;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Http;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Resilience;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Safety;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Validation;
using ArchLucid.Host.Composition.AzureOpenAI;
using ArchLucid.Host.Composition.Caching;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.DevTesting;
using ArchLucid.Host.Core.Diagnostics;
using ArchLucid.Host.Core.Http;
using ArchLucid.Host.Core.Resilience;
using ArchLucid.Host.Core.Services;
using ArchLucid.Host.Core.Startup;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Coordination.Caching;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Retrieval.Admin;
using ArchLucid.Retrieval.Agentic;
using ArchLucid.Retrieval.Chunking;
using ArchLucid.Retrieval.Citations;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.FineTuning.Consent;
using ArchLucid.Retrieval.FineTuning.Evaluation;
using ArchLucid.Retrieval.FineTuning.Export;
using ArchLucid.Retrieval.FineTuning.Orchestration;
using ArchLucid.Retrieval.FineTuning.Redaction;
using ArchLucid.Retrieval.FineTuning.Registry;
using ArchLucid.Retrieval.FineTuning;
using ArchLucid.Retrieval.Graph;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.PolicyPacks;
using ArchLucid.Retrieval.Pricing;
using ArchLucid.Retrieval.Queries;
using ArchLucid.Retrieval.Reranking;
using ArchLucid.Retrieval.Summarization;
using IAgentCompletionClient = ArchLucid.AgentRuntime.IAgentCompletionClient;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Polly;
using System.Text.Json.Serialization;
using System.Text.Json;

using ArchLucid.Host.Composition.Startup.Modules;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

/// <summary>
/// Content safety guard and circuit breaker wiring.
/// </summary>
public static class ContentSafetyCompositionModule
{
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
            services.Configure<ContentSafetyOptions>(configuration.GetSection(ContentSafetyOptions.SectionPath));
            services.AddSingleton<IPostConfigureOptions<ContentSafetyOptions>, ContentSafetyProductionLikePostConfigure>();
            services.AddSingleton<IPostConfigureOptions<ContentSafetyOptions>,
                ContentSafetyAllowNullGuardProductionWarningPostConfigure>();
            services.Configure<CircuitBreakerOptions>(
                "ContentSafetyAzure",
                configuration.GetSection($"{ContentSafetyOptions.SectionPath}:CircuitBreaker"));
            services.PostConfigure<CircuitBreakerOptions>("ContentSafetyAzure", static opts => opts.ApplyDefaults());
            services.AddKeyedSingleton<CircuitBreakerGate>(
                "ContentSafetyAzure",
                (sp, _) => AzureOpenAiCircuitBreakerCompositionModule.CreateOpenAiCircuitBreakerGate(sp, "ContentSafetyAzure"));
            services.AddSingleton<IContentSafetyGuard>(sp =>
            {
                IHostEnvironment env = sp.GetRequiredService<IHostEnvironment>();
                IConfiguration cfg = sp.GetRequiredService<IConfiguration>();
                IOptionsMonitor<ContentSafetyOptions> monitor = sp.GetRequiredService<IOptionsMonitor<ContentSafetyOptions>>();
                ContentSafetyOptions opts = monitor.CurrentValue;
                bool prodLike = HostEnvironmentClassification.IsProductionOrStagingLike(env, cfg);

                if (prodLike)
                {
                    if (string.IsNullOrWhiteSpace(opts.Endpoint) || string.IsNullOrWhiteSpace(opts.ApiKey))

                        throw new InvalidOperationException(
                            "ArchLucid:ContentSafety:Endpoint and ArchLucid:ContentSafety:ApiKey are required in Production or Staging "
                            + "(or when ARCHLUCID_ENVIRONMENT is Production or Staging).");


                    if (!Uri.TryCreate(opts.Endpoint, UriKind.Absolute, out Uri? endpoint))

                        throw new InvalidOperationException(
                            "ArchLucid:ContentSafety:Endpoint must be an absolute URI when content safety is mandatory for this host.");


                    ILogger<AzureContentSafetyGuard> logger = sp.GetRequiredService<ILogger<AzureContentSafetyGuard>>();
                    ILogger<CircuitBreakingContentSafetyGuard> resilientLogger =
                        sp.GetRequiredService<ILogger<CircuitBreakingContentSafetyGuard>>();
                    AzureContentSafetyGuard azure =
                        new(endpoint, opts.ApiKey!, monitor, logger);
                    CircuitBreakerGate productionBreaker = sp.GetRequiredKeyedService<CircuitBreakerGate>("ContentSafetyAzure");
                    IPromptRedactor promptRedactor = sp.GetRequiredService<IPromptRedactor>();

                    return new CircuitBreakingContentSafetyGuard(
                        azure,
                        productionBreaker,
                        promptRedactor,
                        monitor,
                        sp.GetRequiredService<IServiceScopeFactory>(),
                        resilientLogger);
                }

                if (!opts.Enabled)
                {
                    if (!opts.AllowNullGuardInDevelopment)

                        throw new InvalidOperationException(
                            "ArchLucid:ContentSafety:Enabled is false but AllowNullGuardInDevelopment is false. "
                            + "Enable content safety or set AllowNullGuardInDevelopment=true for development.");


                    return new NullContentSafetyGuard();
                }

                if (string.IsNullOrWhiteSpace(opts.Endpoint) || string.IsNullOrWhiteSpace(opts.ApiKey))
                    return new ContentSafetyEnabledButUnconfiguredGuard();

                if (!Uri.TryCreate(opts.Endpoint, UriKind.Absolute, out Uri? endpointDev))

                    throw new InvalidOperationException(
                        "ArchLucid:ContentSafety:Endpoint must be an absolute URI when ArchLucid:ContentSafety:Enabled is true.");


                ILogger<AzureContentSafetyGuard> devLogger = sp.GetRequiredService<ILogger<AzureContentSafetyGuard>>();
                ILogger<CircuitBreakingContentSafetyGuard> resilientDevLogger =
                    sp.GetRequiredService<ILogger<CircuitBreakingContentSafetyGuard>>();
                AzureContentSafetyGuard azureDev = new(endpointDev, opts.ApiKey!, monitor, devLogger);
                CircuitBreakerGate developmentBreaker = sp.GetRequiredKeyedService<CircuitBreakerGate>("ContentSafetyAzure");

                return new CircuitBreakingContentSafetyGuard(
                    azureDev,
                    developmentBreaker,
                    sp.GetRequiredService<IPromptRedactor>(),
                    monitor,
                    sp.GetRequiredService<IServiceScopeFactory>(),
                    resilientDevLogger);
            });
    }

}
