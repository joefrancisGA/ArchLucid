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
/// LLM telemetry, quotas, evaluation, and prompt infrastructure.
/// </summary>
public static class AgentLlmSupportCompositionModule
{
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
            services.Configure<AgentPromptCatalogOptions>(
                configuration.GetSection(AgentPromptCatalogOptions.SectionName));
            services.Configure<PromptVariantOptions>(configuration.GetSection(PromptVariantOptions.SectionPath));
            services.AddSingleton<CachedAgentSystemPromptCatalog>();
            services.AddSingleton<IPromptVariantRegistry, SqlPromptVariantRegistry>();
            services.AddSingleton<IPromptVariantSelector, PromptVariantSelector>();
            services.AddSingleton<IAgentSystemPromptCatalog, VariantAwareAgentSystemPromptCatalog>();
            services.Configure<AgentExecutionResilienceOptions>(
                configuration.GetSection(AgentExecutionResilienceOptions.SectionName));
            services.PostConfigure<AgentExecutionResilienceOptions>(static o => o.Normalize());
            services.AddSingleton<IAgentHandlerConcurrencyGate, AgentHandlerConcurrencyGate>();
            services.AddSingleton<InMemoryAuditRetryQueue>();
            services.AddSingleton<IAuditRetryQueue>(static sp => sp.GetRequiredService<InMemoryAuditRetryQueue>());
            services.AddHostedService<AuditRetryDrainHostedService>();
            services.AddSingleton<CircuitBreakerAuditBridge>();
            services.Configure<LlmTokenQuotaOptions>(configuration.GetSection(LlmTokenQuotaOptions.SectionName));
            services.Configure<LlmDailyTenantTokenWindowOptions>(
                configuration.GetSection(LlmDailyTenantTokenWindowOptions.SectionName));
            services.AddScoped<LlmDailyTenantBudgetTracker>();
            services.AddOptions<LlmJudgeDailyTokenBudgetOptions>()
                .Bind(configuration.GetSection(LlmJudgeDailyTokenBudgetOptions.LegacySectionPath))
                .Bind(configuration.GetSection(LlmJudgeDailyTokenBudgetOptions.SectionPath));
            services.PostConfigure<LlmJudgeDailyTokenBudgetOptions>(static o =>
            {
                o.HardCutoffTokensPerUtcDay = Math.Max(1L, o.HardCutoffTokensPerUtcDay);
                o.AssumedMaxTotalTokensPerRequest = Math.Clamp(o.AssumedMaxTotalTokensPerRequest, 1, 2_000_000);
            });
            services.AddScoped<LlmJudgeDailyTokenBudgetTracker>();
            services.AddScoped<ILlmJudgeBudgetTracker>(static sp => sp.GetRequiredService<LlmJudgeDailyTokenBudgetTracker>());
            services.Configure<LlmMonthlyTenantDollarBudgetOptions>(
                configuration.GetSection(LlmMonthlyTenantDollarBudgetOptions.SectionName));
            services.AddScoped<LlmMonthlyTenantDollarBudgetTracker>();
            services.Configure<LlmTelemetryOptions>(configuration.GetSection(LlmTelemetryOptions.SectionName));
            services.Configure<RetrievalTelemetryOptions>(configuration.GetSection(RetrievalTelemetryOptions.SectionName));
            services.AddSingleton<IPostConfigureOptions<RetrievalTelemetryOptions>,
                RetrievalTelemetryProductionWarningPostConfigure>();
            services.Configure<FallbackLlmOptions>(configuration.GetSection(FallbackLlmOptions.SectionName));
            services.Configure<AgentExecutionTraceStorageOptions>(
                configuration.GetSection(AgentExecutionTraceStorageOptions.SectionPath));
            services.Configure<LlmPromptRedactionOptions>(configuration.GetSection(LlmPromptRedactionOptions.SectionName));
            services.Configure<LlmContextWindowOptions>(configuration.GetSection(LlmContextWindowOptions.SectionPath));
            services.AddSingleton<ITokenCounter, CharHeuristicTokenCounter>();
            services.AddSingleton<ITokenCounterResolver, CatalogTokenCounterResolver>();
            services.AddSingleton<IPostConfigureOptions<LlmPromptRedactionOptions>, LlmPromptRedactionProductionWarningPostConfigure>();
            services.Configure<LlmCompletionCacheOptions>(configuration.GetSection(LlmCompletionCacheOptions.SectionName));
            services.AddSingleton<ISemanticCache>(sp =>
            {
                IOptions<LlmCompletionCacheOptions> startupOpts =
                    sp.GetRequiredService<IOptions<LlmCompletionCacheOptions>>();
                int maxEntries = Math.Max(1, startupOpts.Value.MaxEntries);

                MemoryCache memoryCache =
                    new(new MemoryCacheOptions { SizeLimit = maxEntries });

                IOptionsMonitor<LlmCompletionCacheOptions> monitor =
                    sp.GetRequiredService<IOptionsMonitor<LlmCompletionCacheOptions>>();

                return new MemorySemanticCache(memoryCache, monitor);
            });
            services.AddSingleton<ILlmCompletionResponseCache>(sp =>
                new LlmCompletionResponseCache(sp.GetRequiredService<ISemanticCache>()));
            services.AddSingleton<IPromptRedactor, PromptRedactor>();
            services.AddOptions<AgentOutputLlmSemanticJudgeOptions>()
                .Bind(configuration.GetSection(AgentOutputLlmSemanticJudgeOptions.LegacySectionPath))
                .Bind(configuration.GetSection(AgentOutputLlmSemanticJudgeOptions.SectionPath));
            services.PostConfigure<AgentOutputLlmSemanticJudgeOptions>(static o =>
            {
                o.BlendWeight = Math.Clamp(o.BlendWeight, 0.0, 1.0);
                o.WarnGateWhenJudgeHeuristicDisagreementAbove =
                    Math.Clamp(o.WarnGateWhenJudgeHeuristicDisagreementAbove, 0.0, 1.0);
                o.JudgeInvocationCount = Math.Clamp(o.JudgeInvocationCount, 1, 8);
                o.MaxInputCharacters = Math.Clamp(o.MaxInputCharacters, 1024, 500_000);
                o.MaxCompletionTokens = Math.Clamp(o.MaxCompletionTokens, 64, 4096);
                o.TimeoutSeconds = Math.Clamp(o.TimeoutSeconds, 5, 120);
            });
            services.AddOptions<AgentOutputLlmFaithfulnessOptions>()
                .Bind(configuration.GetSection(AgentOutputLlmFaithfulnessOptions.SectionPath));
            services.PostConfigure<AgentOutputLlmFaithfulnessOptions>(static o =>
            {
                o.MaxEvidenceCharacters = Math.Clamp(o.MaxEvidenceCharacters, 1024, 500_000);
                o.MaxInputCharacters = Math.Clamp(o.MaxInputCharacters, 1024, 500_000);
                o.TimeoutSeconds = Math.Clamp(o.TimeoutSeconds, 5, 120);
                o.MinScoreRejectBelow = Math.Clamp(o.MinScoreRejectBelow, 0.0, 1.0);

                if (o.MinScoreWarnBelow is { } warnFloor)
                    o.MinScoreWarnBelow = Math.Clamp(warnFloor, 0.0, 1.0);
            });
            services.AddSingleton<AgentOutputEvaluator>();
            services.AddSingleton<IAgentOutputEvaluator>(static sp => sp.GetRequiredService<AgentOutputEvaluator>());
            services.AddSingleton<IAgentResultEvidenceFaithfulnessChecker, AgentResultEvidenceFaithfulnessChecker>();
            services.Configure<AgentFaithfulnessOptions>(
                configuration.GetSection(AgentFaithfulnessOptions.SectionPath));
            services.PostConfigure<AgentFaithfulnessOptions>(static o =>
            {
                o.EmbeddingMaxChunkUtf16Length = Math.Clamp(o.EmbeddingMaxChunkUtf16Length, 128, 8192);
                int maxOverlap = Math.Max(0, o.EmbeddingMaxChunkUtf16Length - 1);
                o.EmbeddingChunkOverlapUtf16 = Math.Clamp(o.EmbeddingChunkOverlapUtf16, 0, maxOverlap);
                o.MinDistinctOverlapTokens = Math.Clamp(o.MinDistinctOverlapTokens, 1, 32);
                o.MinOverlapDensityRatio = Math.Clamp(o.MinOverlapDensityRatio, 0.0, 1.0);
            });
            services.AddSingleton<IAgentResultEmbeddingFaithfulnessScorer, AgentResultEmbeddingFaithfulnessScorer>();
            services.AddSingleton<HeuristicAgentOutputSemanticEvaluator>();
            services.AddSingleton<IHeuristicAgentOutputSemanticEvaluator>(static sp =>
                sp.GetRequiredService<HeuristicAgentOutputSemanticEvaluator>());
            services.AddSingleton<AgentOutputLlmSemanticJudge>();
            services.AddSingleton<IAgentOutputLlmSemanticJudge>(static sp =>
                sp.GetRequiredService<AgentOutputLlmSemanticJudge>());
            services.AddSingleton<AgentOutputFaithfulnessEvaluator>();
            services.AddSingleton<IAgentOutputFaithfulnessEvaluator>(static sp =>
                sp.GetRequiredService<AgentOutputFaithfulnessEvaluator>());
            services.AddSingleton<CompositeAgentOutputSemanticEvaluator>();
            services.AddSingleton<IAgentOutputSemanticEvaluator>(static sp =>
                sp.GetRequiredService<CompositeAgentOutputSemanticEvaluator>());
            services.AddSingleton<HeuristicOnlyAgentOutputSemanticEvaluator>();
            services.AddSingleton<IAgentOutputEvaluationHarness, AgentOutputEvaluationHarness>();
            services.AddSingleton<IValidateOptions<AgentOutputQualityGateOptions>, AgentOutputQualityGateOptionsValidator>();
            services.AddOptions<AgentOutputQualityGateOptions>()
                .Bind(configuration.GetSection(AgentOutputQualityGateOptions.SectionPath))
                .ValidateOnStart();
            services.AddSingleton<IAgentOutputQualityGate, AgentOutputQualityGate>();
            // Scoped: depends on IAgentEvidencePackageRepository (scoped) and is consumed from scoped IPilotRunDeltaComputer.
            services.AddScoped<IRunAgentOutputPilotEvidenceAggregator, RunAgentOutputPilotEvidenceAggregator>();
            services.Configure<AgentExecutionReferenceEvaluationOptions>(
                configuration.GetSection(AgentExecutionReferenceEvaluationOptions.SectionPath));
            services.AddSingleton<IAgentOutputReferenceCaseCatalog>(sp =>
            {
                IHostEnvironment env = sp.GetRequiredService<IHostEnvironment>();
                IOptionsMonitor<AgentExecutionReferenceEvaluationOptions> refOpts =
                    sp.GetRequiredService<IOptionsMonitor<AgentExecutionReferenceEvaluationOptions>>();
                ILogger<AgentOutputReferenceCaseCatalog> log = sp.GetRequiredService<ILogger<AgentOutputReferenceCaseCatalog>>();

                return new AgentOutputReferenceCaseCatalog(refOpts, env.ContentRootPath, log);
            });
            services.AddScoped<AgentOutputReferenceCaseRunEvaluator>();
            services.AddScoped<AgentOutputEvaluationRecorder>();
            services.AddScoped<AgentEvaluationConfidencePipeline>();
            services.AddScoped<IAgentArchitectureFindingConfidenceEnricher, AgentArchitectureFindingConfidenceEnricher>();
            services.AddScoped<IFindingsSnapshotEvaluationConfidenceEnricher, FindingsSnapshotEvaluationConfidenceEnricher>();
            services.AddScoped<IAgentOutputTraceEvaluationHook, AgentOutputTraceEvaluationHook>();
            services.Configure<AgentResultSchemaValidationOptions>(
                configuration.GetSection(AgentResultSchemaValidationOptions.SectionPath));
            services.AddSingleton<IPostConfigureOptions<AgentResultSchemaValidationOptions>,
                AgentResultSchemaValidationProductionWarningPostConfigure>();
            services.Configure<AgentSchemaRemediationOptions>(
                configuration.GetSection(AgentSchemaRemediationOptions.SectionPath));
            services.PostConfigure<AgentSchemaRemediationOptions>(static o => o.Normalize());
            services.Configure<AgentLogicalStepSpendCapOptions>(
                configuration.GetSection(AgentLogicalStepSpendCapOptions.SectionPath));
            services.PostConfigure<AgentLogicalStepSpendCapOptions>(static o => o.Normalize());
            services.AddSingleton<IAgentLogicalStepSpendCapPolicy, AgentLogicalStepSpendCapPolicy>();
    }

}
