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
/// Agent executor registration, completion client selection, and Quick Scan.
/// </summary>
public static class AgentExecutionCompositionModule
{
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
        AgentEnrichersCompositionModule.Register(services, configuration);
        ContentSafetyCompositionModule.Register(services, configuration);
        AgentLlmSupportCompositionModule.Register(services, configuration);
        LlmBatchCompositionModule.Register(services, configuration);
        AgentModelTierCompositionModule.Register(services, configuration);

                bool allowDevAgentExecutionModeHeaderOverride = configuration.GetValue(
                    $"{DeveloperExperienceOptions.SectionName}:{nameof(DeveloperExperienceOptions.AllowAgentExecutionModeHeaderOverride)}",
                    false);

                services.AddSingleton<IEffectiveAgentExecutionModeAccessor, EffectiveAgentExecutionModeAccessor>();

                string? agentMode = configuration["AgentExecution:Mode"];

                if (allowDevAgentExecutionModeHeaderOverride)
                {
                    agentMode = DevAgentExecutionModeHeaderNames.Real;
                }
                string? completionClientRaw = configuration["AgentExecution:CompletionClient"]?.Trim();
                bool useEchoClient = string.Equals(agentMode, "Real", StringComparison.OrdinalIgnoreCase)
                                      && string.Equals(completionClientRaw, "Echo", StringComparison.OrdinalIgnoreCase);

                bool completionIsExplicitAzure = string.Equals(completionClientRaw, "AzureOpenAi", StringComparison.OrdinalIgnoreCase);
                bool azureKeysPresent = AzureOpenAiConfigurationProbe.IsCompletionStackConfigured(configuration);

                bool useAzureOpenAi = !string.Equals(agentMode, "Simulator", StringComparison.OrdinalIgnoreCase)
                                      && !useEchoClient
                                      && (string.IsNullOrEmpty(completionClientRaw) || completionIsExplicitAzure)
                                      && azureKeysPresent;

                AgentCompletionPipelineCompositionModule.ConfigureLlmTelemetryLabels(services, configuration, agentMode, useAzureOpenAi, useEchoClient);

                if (string.Equals(agentMode, "Simulator", StringComparison.OrdinalIgnoreCase))
                {
                    AgentSimulatorExecutorRegistrar.Register(services);
                }
                else
                {
                    // Deterministic simulator is also used by POST /v1/demo/quickstart which must never call real LLMs.
                    services.AddScoped<DeterministicAgentSimulator>();
                    services.AddScoped<SimulatorExecutionTraceRecordingExecutor>(static sp =>
                        new SimulatorExecutionTraceRecordingExecutor(
                            sp.GetRequiredService<DeterministicAgentSimulator>(),
                            sp.GetRequiredService<IAgentExecutionTraceRecorder>()));

                    if (allowDevAgentExecutionModeHeaderOverride)
                    {
                        services.AddScoped<RealAgentExecutor>();
                        services.AddScoped<DevSwitchableAgentExecutor>();
                        services.AddScoped<IAgentExecutor>(static sp => sp.GetRequiredService<DevSwitchableAgentExecutor>());
                    }
                    else
                    {
                        services.AddScoped<IAgentExecutor, RealAgentExecutor>();
                    }
                    services.AddScoped<ITopologyProposalSecondaryCompletionInvoker, TopologyProposalSecondaryCompletionInvoker>();
                    services.AddScoped<IAgentHandler, TopologyAgentHandler>();
                    services.AddScoped<IAgentHandler, CostAgentHandler>();
                    services.AddScoped<IAgentHandler, ComplianceAgentHandler>();
                    services.AddScoped<IAgentHandler, CriticAgentHandler>();
                    services.RemoveAll<IInsightDensityLlmJudge>();
                    services.AddScoped<IInsightDensityLlmJudge, PremiumInsightDensityLlmJudge>();
                    services.AddScoped<IAgentResultParser, AgentResultParser>();

                    if (useEchoClient)
                    {
                        AgentEchoExecutorRegistrar.Register(services);
                    }
                    else if (useAzureOpenAi)
                    {
                        AgentAzureOpenAiExecutorRegistrar.Register(services, configuration);
                    }
                    else

                        AgentCompletionPipelineCompositionModule.RegisterFakeClient(services);

                }

                services.AddScoped<ILlmCompletionProvider>(sp =>
                {
                    IAgentCompletionClient inner = sp.GetRequiredService<IAgentCompletionClient>();
                    IOptionsMonitor<LlmTelemetryLabelOptions> labelOpts = sp.GetRequiredService<IOptionsMonitor<LlmTelemetryLabelOptions>>();
                    LlmTelemetryLabelOptions labels = labelOpts.CurrentValue;

                    return new DelegatingLlmCompletionProvider(inner, labels.ProviderId, labels.ModelDeploymentLabel);
                });

                services.AddScoped<ILlmProvider>(sp => sp.GetRequiredService<ILlmCompletionProvider>());
                services.AddOptions<QuickScanOptions>()
                    .Bind(configuration.GetSection(QuickScanOptions.SectionPath));
                services.AddOptions<QuickScanSafetyOptions>()
                    .Bind(configuration.GetSection(QuickScanSafetyOptions.SectionPath))
                    .ValidateOnStart();
                services.AddSingleton<IValidateOptions<QuickScanSafetyOptions>, QuickScanSafetyOptionsValidator>();
                services.AddOptions<QuickScanModelPricingCatalogOptions>()
                    .Bind(configuration.GetSection(QuickScanModelPricingCatalogOptions.SectionPath))
                    .ValidateOnStart();
                services.AddSingleton<IValidateOptions<QuickScanModelPricingCatalogOptions>, QuickScanModelPricingCatalogOptionsValidator>();
                services.AddSingleton<IQuickScanCostEstimator, QuickScanCostEstimator>();
                services.AddSingleton<IQuickScanGlobalBudgetReservationService, QuickScanGlobalBudgetReservationService>();
                services.Configure<RunScopedLlmBudgetReservationOptions>(
                    configuration.GetSection(RunScopedLlmBudgetReservationOptions.SectionName));
                // Scoped: SQL ILlmTenantBudgetRepository is scoped; cross-request state lives on IRunScopedLlmBudgetReservationStore (singleton).
                services.AddScoped<IRunScopedLlmBudgetReservationService, RunScopedLlmBudgetReservationService>();
                services.AddSingleton<IQuickScanDistributedConcurrencyService, QuickScanDistributedConcurrencyService>();
                services.AddHttpClient(
                    nameof(TurnstileQuickScanBotChallengeVerifier),
                    static client =>
                    {
                        client.Timeout = TimeSpan.FromSeconds(OutboundHttpClientTimeoutSeconds.ExternalIntegration);
                    })
                    .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration);
                services.AddSingleton<IQuickScanBotChallengeVerifier, TurnstileQuickScanBotChallengeVerifier>();
                // Scoped: orchestrator is scoped; store + Turnstile verifier remain singleton-safe.
                services.AddScoped<IQuickScanIdentityAbuseService, QuickScanIdentityAbuseService>();
                services.AddSingleton<IQuickScanSafetyOperationalStateProvider, QuickScanSafetyOperationalStateProvider>();
                services.AddSingleton<IQuickScanSafetyOperationalAdminService, QuickScanSafetyOperationalAdminService>();
                services.AddSingleton<IQuickScanGuard, QuickScanGuard>();
                services.AddSingleton<IQuickScanTelemetry, QuickScanTelemetry>();
                services.AddSingleton<IQuickScanUsageRecorder, QuickScanUsageRecorder>();
                services.AddSingleton<IQuickScanBudgetMonitoringService, QuickScanBudgetMonitoringService>();
                services.AddScoped<IQuickScanExecutionOrchestrator, QuickScanExecutionOrchestrator>();
                services.AddScoped<IQuickScanService, QuickScanService>();
                services.AddScoped<IRegisteredAgentHandlersInspector, RegisteredAgentHandlersInspector>();
    }

}
