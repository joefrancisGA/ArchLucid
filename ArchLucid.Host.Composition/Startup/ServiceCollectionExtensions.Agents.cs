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
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Agents;
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
    private static void RegisterAgentExecution(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<GenerateIacStubsOptions>(configuration.GetSection(GenerateIacStubsOptions.SectionPath));
        services.Configure<RerankFindingsOptions>(configuration.GetSection(RerankFindingsOptions.SectionPath));
        services.Configure<ExplainGovernanceBlocksOptions>(configuration.GetSection(ExplainGovernanceBlocksOptions.SectionPath));
        services.Configure<EvidenceSummarizationOptions>(
            configuration.GetSection(EvidenceSummarizationOptions.SectionPath));
        services.AddScoped(static sp =>
            new Lazy<IAgentTierCompletionRouter>(() => sp.GetRequiredService<IAgentTierCompletionRouter>()));
        services.AddScoped<IEvidenceSummarizationService, EvidenceSummarizationService>();
        services.AddScoped<IFindingIacStubGenerator, FindingIacStubGenerator>();
        services.AddScoped<IFindingPriorityReranker, FindingPriorityReranker>();
        services.Configure<AgentConfidenceCalibrationOptions>(
            configuration.GetSection(AgentConfidenceCalibrationOptions.SectionPath));
        services.Configure<AgentCuratedEvidenceProposalOptions>(
            configuration.GetSection(AgentCuratedEvidenceProposalOptions.SectionPath));
        services.AddScoped<IAgentConfidenceCalibrator, AgentConfidenceCalibrator>();
        services.AddScoped<IAgentConfidenceCalibrationService, AgentConfidenceCalibrationService>();
        services.AddScoped<IPromptVariantStatsService, PromptVariantStatsService>();
        services.AddScoped<IAgentCuratedEvidenceProposer, AgentCuratedEvidenceProposer>();
        services.AddScoped<AgentResultPostExecutionEnricher>();
        services.AddScoped<AgentResultRegionMismatchEnricher>();
        services.AddScoped<IAgentResultPostExecutionEnricher>(static sp =>
            new CompositeAgentResultPostExecutionEnricher(
            [
                sp.GetRequiredService<AgentResultPostExecutionEnricher>(),
                sp.GetRequiredService<AgentResultRegionMismatchEnricher>(),
            ]));
        services.AddSingleton<IAgentEvidenceUntrustedInputSanitizer, AgentEvidenceUntrustedInputSanitizer>();
        services.AddScoped<IEvidenceProposalQueryService, EvidenceProposalQueryService>();
        services.AddScoped<IEvidenceProposalPromoter, EvidenceProposalPromoter>();
        services.Configure<AgentExecutionOptions>(configuration.GetSection(AgentExecutionOptions.SectionName));
        services.Configure<StagedCriticAgentOptions>(
            configuration.GetSection(StagedCriticAgentOptions.SectionPath));
        services.Configure<ArchLucidLlmOptions>(configuration.GetSection(ArchLucidLlmOptions.SectionPath));
        services.AddSingleton<IPostConfigureOptions<StagedCriticAgentOptions>,
            StagedCriticAgentOptionsNormalizePostConfigure>();
        services.AddOptions<AzureOpenAiOptions>()
            .Bind(configuration.GetSection(AzureOpenAiOptions.SectionName))
            .ValidateOnStart();
        services.AddSingleton<IValidateOptions<AzureOpenAiOptions>, AzureOpenAiOptionsValidator>();
        services.Configure<ArchLucidPersistenceOptions>(
            configuration.GetSection(ArchLucidPersistenceOptions.SectionPath));
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
            (sp, _) => CreateOpenAiCircuitBreakerGate(sp, "ContentSafetyAzure"));
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
        RegisterLlmBatchServices(services, configuration);
        services.Configure<RetrievalTelemetryOptions>(configuration.GetSection(RetrievalTelemetryOptions.SectionName));
        services.AddSingleton<IPostConfigureOptions<RetrievalTelemetryOptions>,
            RetrievalTelemetryProductionWarningPostConfigure>();
        services.Configure<FallbackLlmOptions>(configuration.GetSection(FallbackLlmOptions.SectionName));
        services.Configure<AgentExecutionTraceStorageOptions>(
            configuration.GetSection(AgentExecutionTraceStorageOptions.SectionPath));
        services.Configure<LlmPromptRedactionOptions>(configuration.GetSection(LlmPromptRedactionOptions.SectionName));
        services.Configure<LlmContextWindowOptions>(configuration.GetSection(LlmContextWindowOptions.SectionPath));
        services.AddSingleton<ITokenCounter, CharHeuristicTokenCounter>();
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

        RegisterAgentModelTierOrchestration(services, configuration);

        string? agentMode = configuration["AgentExecution:Mode"];
        string? completionClientRaw = configuration["AgentExecution:CompletionClient"]?.Trim();
        bool useEchoClient = string.Equals(agentMode, "Real", StringComparison.OrdinalIgnoreCase)
                              && string.Equals(completionClientRaw, "Echo", StringComparison.OrdinalIgnoreCase);

        bool completionIsExplicitAzure = string.Equals(completionClientRaw, "AzureOpenAi", StringComparison.OrdinalIgnoreCase);
        bool azureKeysPresent = AzureOpenAiConfigurationProbe.IsCompletionStackConfigured(configuration);

        bool useAzureOpenAi = !string.Equals(agentMode, "Simulator", StringComparison.OrdinalIgnoreCase)
                              && !useEchoClient
                              && (string.IsNullOrEmpty(completionClientRaw) || completionIsExplicitAzure)
                              && azureKeysPresent;

        ConfigureLlmTelemetryLabels(services, configuration, agentMode, useAzureOpenAi, useEchoClient);

        if (string.Equals(agentMode, "Simulator", StringComparison.OrdinalIgnoreCase))
        {
            services.AddScoped<DeterministicAgentSimulator>();
            services.AddScoped<IdempotentAgentExecutor>(static sp =>
                new IdempotentAgentExecutor(
                    sp.GetRequiredService<DeterministicAgentSimulator>(),
                    sp.GetRequiredService<IAgentResultRepository>(),
                    sp.GetRequiredService<IScopeContextProvider>(),
                    sp.GetRequiredService<ILogger<IdempotentAgentExecutor>>()));
            services.AddScoped<SimulatorExecutionTraceRecordingExecutor>(static sp =>
                new SimulatorExecutionTraceRecordingExecutor(
                    sp.GetRequiredService<IdempotentAgentExecutor>(),
                    sp.GetRequiredService<IAgentExecutionTraceRecorder>()));
            services.AddScoped<IAgentExecutor>(static sp => sp.GetRequiredService<SimulatorExecutionTraceRecordingExecutor>());
            RegisterFakeAgentCompletionClient(services);
        }
        else
        {
            // Deterministic simulator is also used by POST /v1/demo/quickstart which must never call real LLMs.
            services.AddScoped<DeterministicAgentSimulator>();
            services.AddScoped<SimulatorExecutionTraceRecordingExecutor>(static sp =>
                new SimulatorExecutionTraceRecordingExecutor(
                    sp.GetRequiredService<DeterministicAgentSimulator>(),
                    sp.GetRequiredService<IAgentExecutionTraceRecorder>()));
            services.AddScoped<IAgentExecutor, RealAgentExecutor>();
            services.AddScoped<IAgentHandler, TopologyAgentHandler>();
            services.AddScoped<IAgentHandler, CostAgentHandler>();
            services.AddScoped<IAgentHandler, ComplianceAgentHandler>();
            services.AddScoped<IAgentHandler, CriticAgentHandler>();
            services.RemoveAll<IInsightDensityLlmJudge>();
            services.AddScoped<IInsightDensityLlmJudge, PremiumInsightDensityLlmJudge>();
            services.AddScoped<IAgentResultParser, AgentResultParser>();

            if (useEchoClient)
            {
                services.AddSingleton<LlmTokenQuotaWindowTracker>();
                RegisterEchoAgentCompletionPipeline(services);
            }
            else if (useAzureOpenAi)
            {
                FallbackLlmOptions fallbackOpts =
                    configuration.GetSection(FallbackLlmOptions.SectionName).Get<FallbackLlmOptions>()
                    ?? new FallbackLlmOptions();

                bool fallbackLlmEnabled = fallbackOpts.Enabled;

                if (fallbackLlmEnabled)
                    _ = FallbackLlmConfigurationResolver.ResolveOrderedEndpoints(fallbackOpts);

                services.AddKeyedSingleton<CircuitBreakerGate>(
                    OpenAiCircuitBreakerKeys.Completion,
                    (sp, _) => CreateOpenAiCircuitBreakerGate(sp, OpenAiCircuitBreakerKeys.Completion));

                if (fallbackLlmEnabled)
                {
                    services.AddKeyedSingleton<CircuitBreakerGate>(
                        OpenAiCircuitBreakerKeys.CompletionFallback,
                        (sp, _) => CreateOpenAiCircuitBreakerGate(sp, OpenAiCircuitBreakerKeys.CompletionFallback));

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
                        BinaryData? schema = ResolveStructuredOutputAgentResultSchema(cfg, ao);
                        ILogger<AzureOpenAiCompletionClient> completionLogger =
                            sp.GetRequiredService<ILogger<AzureOpenAiCompletionClient>>();

                        List<AzureOpenAiCompletionClient> clients = new(ordered.Count);

                        IOptionsMonitor<LlmTelemetryOptions> llmTelemetryOptions =
                            sp.GetRequiredService<IOptionsMonitor<LlmTelemetryOptions>>();

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
                                    llmTelemetryOptions));
                        }

                        return new FallbackAzureOpenAiInnerClientsRegistry { Clients = clients };
                    });
                }

                services.AddSingleton<AzureOpenAiCompletionClientCache>(sp =>
                {
                    IConfiguration config = sp.GetRequiredService<IConfiguration>();
                    string endpoint = config["AzureOpenAI:Endpoint"]
                                      ?? throw new InvalidOperationException("AzureOpenAI:Endpoint is missing.");
                    string? apiKey = config["AzureOpenAI:ApiKey"];
                    string authenticationMode = config["AzureOpenAI:AuthenticationMode"]?.Trim() ?? "ApiKey";
                    int maxTokens = config.GetValue("AzureOpenAI:MaxCompletionTokens", 0);

                    if (maxTokens <= 0)

                        maxTokens = AzureOpenAiCompletionClient.DefaultMaxCompletionTokens;


                    AzureOpenAiOptions ao = sp.GetRequiredService<IOptions<AzureOpenAiOptions>>().Value;
                    BinaryData? schema = ResolveStructuredOutputAgentResultSchema(config, ao);
                    ILogger<AzureOpenAiCompletionClient> completionLogger =
                        sp.GetRequiredService<ILogger<AzureOpenAiCompletionClient>>();
                    IOptionsMonitor<LlmTelemetryOptions> llmTelemetryOptions =
                        sp.GetRequiredService<IOptionsMonitor<LlmTelemetryOptions>>();

                    bool useManagedIdentity =
                        string.Equals(authenticationMode, "ManagedIdentity", StringComparison.OrdinalIgnoreCase);

                    return new AzureOpenAiCompletionClientCache(deploymentName =>
                    {
                        if (useManagedIdentity)
                        {
                            return AzureOpenAiCompletionClient.CreateWithManagedIdentity(
                                endpoint,
                                deploymentName,
                                maxTokens,
                                schema,
                                completionLogger,
                                llmTelemetryOptions);
                        }

                        if (string.IsNullOrWhiteSpace(apiKey))
                        {
                            throw new InvalidOperationException(
                                "AzureOpenAI:ApiKey is missing while AuthenticationMode is ApiKey.");
                        }

                        return new AzureOpenAiCompletionClient(
                            endpoint,
                            apiKey,
                            deploymentName,
                            maxTokens,
                            schema,
                            completionLogger,
                            llmTelemetryOptions);
                    });
                });

                services.AddSingleton<AzureOpenAiCompletionClient>(sp =>
                {
                    IConfiguration config = sp.GetRequiredService<IConfiguration>();
                    string endpoint = config["AzureOpenAI:Endpoint"]
                                      ?? throw new InvalidOperationException("AzureOpenAI:Endpoint is missing.");
                    string? apiKey = config["AzureOpenAI:ApiKey"];
                    string authenticationMode = config["AzureOpenAI:AuthenticationMode"]?.Trim() ?? "ApiKey";
                    string deploymentName = config["AzureOpenAI:DeploymentName"]
                                            ?? throw new InvalidOperationException("AzureOpenAI:DeploymentName is missing.");
                    int maxTokens = config.GetValue("AzureOpenAI:MaxCompletionTokens", 0);

                    if (maxTokens <= 0)

                        maxTokens = AzureOpenAiCompletionClient.DefaultMaxCompletionTokens;


                    AzureOpenAiOptions ao = sp.GetRequiredService<IOptions<AzureOpenAiOptions>>().Value;
                    BinaryData? schema = ResolveStructuredOutputAgentResultSchema(config, ao);
                    ILogger<AzureOpenAiCompletionClient> completionLogger =
                        sp.GetRequiredService<ILogger<AzureOpenAiCompletionClient>>();
                    IOptionsMonitor<LlmTelemetryOptions> llmTelemetryOptions =
                        sp.GetRequiredService<IOptionsMonitor<LlmTelemetryOptions>>();

                    if (string.Equals(authenticationMode, "ManagedIdentity", StringComparison.OrdinalIgnoreCase))
                    {
                        return AzureOpenAiCompletionClient.CreateWithManagedIdentity(
                            endpoint,
                            deploymentName,
                            maxTokens,
                            schema,
                            completionLogger,
                            llmTelemetryOptions);
                    }

                    if (string.IsNullOrWhiteSpace(apiKey))
                        throw new InvalidOperationException("AzureOpenAI:ApiKey is missing.");

                    return new AzureOpenAiCompletionClient(
                        endpoint,
                        apiKey,
                        deploymentName,
                        maxTokens,
                        schema,
                        completionLogger,
                        llmTelemetryOptions);
                });

                services.AddSingleton<LlmTokenQuotaWindowTracker>();

                services.AddKeyedScoped<IAgentCompletionClient>(
                    AgentOutputLlmJudgeCompletionServiceKey.Value,
                    static (sp, _) => BuildAgentOutputSemanticJudgeCompletionChain(sp));

                services.AddScoped<ScopedInnerAgentCompletionClient>(sp =>
                {
                    AzureOpenAiCompletionClient azureInner = sp.GetRequiredService<AzureOpenAiCompletionClient>();
                    IConfiguration config = sp.GetRequiredService<IConfiguration>();
                    string primaryDeployment = config["AzureOpenAI:DeploymentName"]
                        ?? throw new InvalidOperationException("AzureOpenAI:DeploymentName is missing.");
                    CircuitBreakerGate primaryGate =
                        sp.GetRequiredKeyedService<CircuitBreakerGate>(OpenAiCircuitBreakerKeys.Completion);

                    IAgentCompletionClient primaryChain = BuildAzureOpenAiScopedCompletionChain(
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
                    secondaryChains.AddRange(registry.Clients.Select(fbInner => BuildAzureOpenAiScopedCompletionChain(sp, fbInner, fallbackGate, fbInner.Descriptor.ModelId)));

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

                RegisterTieredAzureCompletionRouter(services);
                RegisterSchemaRemediationAgentCompletionClient(services, useAzureOpenAi: true);
                RegisterAgentCompletionClientFromTierRouter(services);
            }
            else

                RegisterFakeAgentCompletionClient(services);

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
        services.AddScoped<IQuickScanExecutionOrchestrator, QuickScanExecutionOrchestrator>();
        services.AddScoped<IQuickScanService, QuickScanService>();
        services.AddScoped<IRegisteredAgentHandlersInspector, RegisteredAgentHandlersInspector>();
    }

    private static void ConfigureLlmTelemetryLabels(
        IServiceCollection services,
        IConfiguration configuration,
        string? agentMode,
        bool useAzureOpenAi,
        bool useEchoClient)
    {
        services.Configure<LlmTelemetryLabelOptions>(options =>
        {
            if (useEchoClient)
            {
                options.ProviderId = "echo";
                options.ModelDeploymentLabel = "echo";
            }
            else if (useAzureOpenAi)
            {
                options.ProviderId = "azure-openai";
                options.ModelDeploymentLabel = configuration["AzureOpenAI:DeploymentName"]?.Trim() ?? "unknown";
            }
            else if (string.Equals(agentMode, "Simulator", StringComparison.OrdinalIgnoreCase))
            {
                options.ProviderId = "simulator";
                options.ModelDeploymentLabel = "deterministic";
            }
            else
            {
                options.ProviderId = "fake";
                options.ModelDeploymentLabel = "fake";
            }
        });
    }

    private static void RegisterEchoAgentCompletionPipeline(IServiceCollection services)
    {
        services.AddScoped<ScopedInnerAgentCompletionClient>(sp =>
        {
            EchoAgentCompletionClient echoInner = new();
            LlmTokenQuotaWindowTracker quotaTracker = sp.GetRequiredService<LlmTokenQuotaWindowTracker>();
            IScopeContextProvider scopeProvider = sp.GetRequiredService<IScopeContextProvider>();
            IOptionsMonitor<LlmTokenQuotaOptions> quotaOpts = sp.GetRequiredService<IOptionsMonitor<LlmTokenQuotaOptions>>();
            IOptionsMonitor<LlmTelemetryOptions> telemetryOpts =
                sp.GetRequiredService<IOptionsMonitor<LlmTelemetryOptions>>();
            IOptionsMonitor<LlmTelemetryLabelOptions> labelTelemetryOpts =
                sp.GetRequiredService<IOptionsMonitor<LlmTelemetryLabelOptions>>();
            IOptionsMonitor<LlmPromptRedactionOptions> redactionOpts =
                sp.GetRequiredService<IOptionsMonitor<LlmPromptRedactionOptions>>();
            IPromptRedactor promptRedactor = sp.GetRequiredService<IPromptRedactor>();
            IUsageMeteringService usageMetering = sp.GetRequiredService<IUsageMeteringService>();
            IOptionsMonitor<LlmDailyTenantTokenWindowOptions> dailyBudgetOpts =
                sp.GetRequiredService<IOptionsMonitor<LlmDailyTenantTokenWindowOptions>>();
            LlmDailyTenantBudgetTracker dailyBudgetTracker = sp.GetRequiredService<LlmDailyTenantBudgetTracker>();
            IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> monthlyDollarOpts =
                sp.GetRequiredService<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>>();
            LlmMonthlyTenantDollarBudgetTracker monthlyDollarTracker =
                sp.GetRequiredService<LlmMonthlyTenantDollarBudgetTracker>();
            IAuditService auditService = sp.GetRequiredService<IAuditService>();
            ILogger<LlmCompletionAccountingClient> accountingLogger =
                sp.GetRequiredService<ILogger<LlmCompletionAccountingClient>>();

            IAgentCompletionClient completionPipeline = new LlmCompletionAccountingClient(
                echoInner,
                quotaTracker,
                scopeProvider,
                quotaOpts,
                telemetryOpts,
                labelTelemetryOpts,
                redactionOpts,
                promptRedactor,
                usageMetering,
                dailyBudgetOpts,
                dailyBudgetTracker,
                monthlyDollarOpts,
                monthlyDollarTracker,
                sp.GetRequiredService<ILlmCostEstimator>(),
                sp.GetRequiredService<IAiBudgetPreCallGuard>(),
                sp.GetRequiredService<IDemoAiPromptCache>(),
                sp.GetRequiredService<IOptionsMonitor<AiUsageControlsOptions>>(),
                auditService,
                accountingLogger);

            IConfiguration config = sp.GetRequiredService<IConfiguration>();

            bool modernCompletionCacheEnabled = IsAgentRuntimeCompletionCacheEnabled(config);

            completionPipeline =
                WrapWithAgentRuntimeCompletionCacheIfEnabled(sp, completionPipeline, simulatorMode: false);

            LlmCompletionResponseCacheOptions cacheOptions = config
                                                                   .GetSection(LlmCompletionResponseCacheOptions.SectionName)
                                                                   .Get<LlmCompletionResponseCacheOptions>()
                                                               ?? new LlmCompletionResponseCacheOptions();

            if (!cacheOptions.Enabled || modernCompletionCacheEnabled)
            {
                IAgentCompletionClient guarded = new CostGuardrailInterceptor(
                    completionPipeline,
                    sp.GetRequiredService<IOptions<AgentOutputQualityGateOptions>>(),
                    sp.GetRequiredService<ILlmCostEstimator>());

                return new ScopedInnerAgentCompletionClient(guarded);
            }

            string cacheDeploymentLabel = config["AzureOpenAI:DeploymentName"]?.Trim() ?? "echo";

            TimeSpan ttl = TimeSpan.FromSeconds(Math.Max(1, cacheOptions.AbsoluteExpirationSeconds));
            ILlmCompletionResponseStore store = sp.GetRequiredService<ILlmCompletionResponseStore>();
            ILogger<CachingAgentCompletionClient> cacheLogger =
                sp.GetRequiredService<ILogger<CachingAgentCompletionClient>>();
            completionPipeline = new CachingAgentCompletionClient(
                completionPipeline,
                store,
                cacheDeploymentLabel,
                enabled: true,
                partitionByScope: cacheOptions.PartitionByScope,
                absoluteExpiration: ttl,
                scopeProvider: scopeProvider,
                logger: cacheLogger);

            IAgentCompletionClient guardedCached = new CostGuardrailInterceptor(
                completionPipeline,
                sp.GetRequiredService<IOptions<AgentOutputQualityGateOptions>>(),
                sp.GetRequiredService<ILlmCostEstimator>());

            return new ScopedInnerAgentCompletionClient(guardedCached);
        });

        RegisterPassThroughTierCompletionRouter(services);
        RegisterSchemaRemediationAgentCompletionClient(services, useAzureOpenAi: false);
        RegisterAgentCompletionClientFromTierRouter(services);
    }

    /// <summary>
    /// Ask/Explanation paths resolve <see cref="IAgentCompletionClient"/> even when
    /// <see cref="SimulatorExecutionTraceRecordingExecutor"/> wraps <see cref="DeterministicAgentSimulator"/> (no real agent handlers).
    /// </summary>
    private static void RegisterFakeAgentCompletionClient(IServiceCollection services)
    {
        JsonSerializerOptions jsonOptions = new(JsonSerializerDefaults.Web)
        {
            PropertyNameCaseInsensitive = true,
            Converters = { new JsonStringEnumConverter() }
        };

        services.AddScoped<ScopedInnerAgentCompletionClient>(_ => new ScopedInnerAgentCompletionClient(
            new FakeAgentCompletionClient(
            (systemPrompt, userPrompt) =>
            {
                if (systemPrompt.Contains(QuickScanLlmPrompts.ClientRoutingMarker, StringComparison.OrdinalIgnoreCase))
                    return FakeQuickScanCompletionJson.Build(userPrompt);

                if (systemPrompt.Contains(PolicyPackExplainLlmPrompts.SimulatorRoutingMarker, StringComparison.Ordinal))
                {
                    return """
                           ## Purpose
                           Simulator stub — replace with a live LLM deployment for narrative summaries.

                           ## Key rules
                           - Advisory only; verify against the JSON in production.

                           ## Operational impact
                           None (offline completion).
                           """;
                }

                if (systemPrompt.Contains("senior enterprise architect", StringComparison.OrdinalIgnoreCase))
                {
                    return """
                           {"answer":"Stub grounded answer for offline Ask completions. Risk:\n\nEvidence supports the manifest decisions in scope.\n\nMitigation:\n\nReview referenced decisions before commit.\n\nValidation:\n\nRe-run after manifest changes.","referencedDecisions":[],"referencedFindings":[],"referencedArtifacts":[]}
                           """;
                }

                string runId = "RUN-001";
                string taskId = "TASK-TOPO-001";

                foreach (string line in userPrompt.Split('\n'))
                {
                    ReadOnlySpan<char> span = line.AsSpan().Trim();

                    if (span.StartsWith("RunId:", StringComparison.OrdinalIgnoreCase))

                        runId = span.Length > 6 ? span[6..].Trim().ToString() : runId;

                    else if (span.StartsWith("TaskId:", StringComparison.OrdinalIgnoreCase))

                        taskId = span.Length > 7 ? span[7..].Trim().ToString() : taskId;

                }

                ArchitectureRequest dummyRequest = new()
                {
                    SystemName = "Default",
                    Description = "Default request for fake topology response.",
                    Environment = "prod"
                };
                AgentResult result = FakeScenarioFactory.CreateTopologyResult(runId, taskId, dummyRequest);

                return JsonSerializer.Serialize(result, jsonOptions);
            })));

        RegisterPassThroughTierCompletionRouter(services);
        RegisterSchemaRemediationAgentCompletionClient(services, useAzureOpenAi: false);
        RegisterAgentCompletionClientFromTierRouter(services);
    }

    private static void RegisterAzureOpenAiCircuitBreakerOptions(IServiceCollection services, IConfiguration configuration)
    {
        const string completionPath = "AzureOpenAI:CircuitBreaker:Completion";
        const string embeddingPath = "AzureOpenAI:CircuitBreaker:Embedding";
        const string sharedPath = "AzureOpenAI:CircuitBreaker";

        services.Configure<CircuitBreakerOptions>(
            OpenAiCircuitBreakerKeys.Completion,
            configuration.GetSection(completionPath));
        services.Configure<CircuitBreakerOptions>(
            OpenAiCircuitBreakerKeys.Embedding,
            configuration.GetSection(embeddingPath));
        services.Configure<CircuitBreakerOptions>(
            OpenAiCircuitBreakerKeys.CompletionFallback,
            configuration.GetSection(completionPath));

        services.PostConfigure<CircuitBreakerOptions>(
            OpenAiCircuitBreakerKeys.Completion,
            opts => ApplySharedOpenAiCircuitBreakerFallback(configuration, completionPath, sharedPath, opts));

        services.PostConfigure<CircuitBreakerOptions>(
            OpenAiCircuitBreakerKeys.Embedding,
            opts => ApplySharedOpenAiCircuitBreakerFallback(configuration, embeddingPath, sharedPath, opts));

        services.PostConfigure<CircuitBreakerOptions>(
            OpenAiCircuitBreakerKeys.CompletionFallback,
            opts => ApplySharedOpenAiCircuitBreakerFallback(configuration, completionPath, sharedPath, opts));
    }

    private static void ApplySharedOpenAiCircuitBreakerFallback(
        IConfiguration configuration,
        string perGateConfigurationPath,
        string sharedConfigurationPath,
        CircuitBreakerOptions options)
    {
        IConfigurationSection perGate = configuration.GetSection(perGateConfigurationPath);
        IConfigurationSection shared = configuration.GetSection(sharedConfigurationPath);

        if (string.IsNullOrEmpty(perGate["FailureThreshold"]))
        {
            int? fromShared = shared.GetValue<int?>("FailureThreshold");

            if (fromShared.HasValue)

                options.FailureThreshold = fromShared.Value;

        }

        if (string.IsNullOrEmpty(perGate["DurationOfBreakSeconds"]))
        {
            int? fromShared = shared.GetValue<int?>("DurationOfBreakSeconds");

            if (fromShared.HasValue)

                options.DurationOfBreakSeconds = fromShared.Value;

        }

        if (string.IsNullOrEmpty(perGate["HalfOpenSuccessThreshold"]))
        {
            int? fromShared = shared.GetValue<int?>("HalfOpenSuccessThreshold");

            if (fromShared.HasValue)

                options.HalfOpenSuccessThreshold = fromShared.Value;

        }

        options.ApplyDefaults();
    }

    private static CircuitBreakerGate CreateOpenAiCircuitBreakerGate(IServiceProvider serviceProvider, string gateName)
    {
        IOptionsMonitor<CircuitBreakerOptions> monitor =
            serviceProvider.GetRequiredService<IOptionsMonitor<CircuitBreakerOptions>>();

        CircuitBreakerAuditBridge? bridge = serviceProvider.GetService<CircuitBreakerAuditBridge>();
        Action<CircuitBreakerAuditEntry>? onAudit = bridge?.CreateCallback();

        TimeProvider clock = serviceProvider.GetRequiredService<TimeProvider>();

        CircuitBreakerGate gate = new(gateName, monitor, clock, onAuditEntry: onAudit);
        CircuitBreakerGateMetricsRegistry.Register(gate);

        return gate;
    }

    private static bool IsAgentRuntimeCompletionCacheEnabled(IConfiguration configuration)
    {
        LlmCompletionCacheOptions? opts =
            configuration.GetSection(LlmCompletionCacheOptions.SectionName).Get<LlmCompletionCacheOptions>();

        return opts?.Enabled ?? false;
    }

    private static IAgentCompletionClient WrapWithAgentRuntimeCompletionCacheIfEnabled(
        IServiceProvider serviceProvider,
        IAgentCompletionClient inner,
        bool simulatorMode)
    {
        IConfiguration configuration = serviceProvider.GetRequiredService<IConfiguration>();

        if (!IsAgentRuntimeCompletionCacheEnabled(configuration))

            return inner;


        ILlmCompletionResponseCache completionCache =
            serviceProvider.GetRequiredService<ILlmCompletionResponseCache>();
        IScopeContextProvider scopeContexts = serviceProvider.GetRequiredService<IScopeContextProvider>();
        IOptionsMonitor<LlmCompletionCacheOptions> completionCacheOptionsMonitor =
            serviceProvider.GetRequiredService<IOptionsMonitor<LlmCompletionCacheOptions>>();
        IOptionsMonitor<LlmTelemetryLabelOptions> telemetryLabelOptionsMonitor =
            serviceProvider.GetRequiredService<IOptionsMonitor<LlmTelemetryLabelOptions>>();
        ILogger<CachingLlmCompletionClient> completionCacheLogger =
            serviceProvider.GetRequiredService<ILogger<CachingLlmCompletionClient>>();

        return new CachingLlmCompletionClient(
            inner,
            completionCache,
            simulatorMode,
            scopeContexts,
            completionCacheOptionsMonitor,
            telemetryLabelOptionsMonitor,
            completionCacheLogger);
    }

    /// <summary>
    ///     Judge-only chain: non-schema Azure JSON completions + content safety + accounting with the isolated judge UTC-day token
    ///     pool (not the run-execution daily cap). Omits completion response caching and per-run cost guard (agent batch only).
    /// </summary>
    private static IAgentCompletionClient BuildAgentOutputSemanticJudgeCompletionChain(IServiceProvider sp)
    {
        IConfiguration config = sp.GetRequiredService<IConfiguration>();
        IOptionsMonitor<AgentOutputLlmSemanticJudgeOptions> judgeOptsMon =
            sp.GetRequiredService<IOptionsMonitor<AgentOutputLlmSemanticJudgeOptions>>();
        AgentOutputLlmSemanticJudgeOptions judgeOpts = judgeOptsMon.CurrentValue;

        string endpoint = config["AzureOpenAI:Endpoint"]?.Trim() ?? string.Empty;
        string apiKey = config["AzureOpenAI:ApiKey"]?.Trim() ?? string.Empty;
        string authenticationMode = config["AzureOpenAI:AuthenticationMode"]?.Trim() ?? "ApiKey";
        string deployment = string.IsNullOrWhiteSpace(judgeOpts.DeploymentName)
            ? config["AzureOpenAI:DeploymentName"]?.Trim() ?? string.Empty
            : judgeOpts.DeploymentName.Trim();

        int maxTok = Math.Clamp(judgeOpts.MaxCompletionTokens, 64, 4096);
        bool useManagedIdentity =
            string.Equals(authenticationMode, "ManagedIdentity", StringComparison.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(endpoint) || string.IsNullOrWhiteSpace(deployment))
        {
            throw new InvalidOperationException(
                "Azure OpenAI endpoint and deployment must be configured when using ArchLucid:Agents:LlmJudge "
                + "(empty DeploymentName falls back to AzureOpenAI:DeploymentName).");
        }

        if (!useManagedIdentity && string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException(
                "Azure OpenAI API key is missing while AuthenticationMode is ApiKey for ArchLucid:Agents:LlmJudge.");
        }

        ILogger<AzureOpenAiCompletionClient> completionLogger =
            sp.GetRequiredService<ILogger<AzureOpenAiCompletionClient>>();
        IOptionsMonitor<LlmTelemetryOptions> llmTelemetryOptions =
            sp.GetRequiredService<IOptionsMonitor<LlmTelemetryOptions>>();

        AzureOpenAiCompletionClient inner = useManagedIdentity
            ? AzureOpenAiCompletionClient.CreateWithManagedIdentity(
                endpoint,
                deployment,
                maxTok,
                structuredOutputAgentResultSchema: null,
                completionLogger,
                llmTelemetryOptions)
            : new AzureOpenAiCompletionClient(
                endpoint,
                apiKey,
                deployment,
                maxTok,
                structuredOutputAgentResultSchema: null,
                completionLogger,
                llmTelemetryOptions);

        IContentSafetyGuard contentSafetyGuard = sp.GetRequiredService<IContentSafetyGuard>();
        IOptionsMonitor<ContentSafetyOptions> contentSafetyOpts =
            sp.GetRequiredService<IOptionsMonitor<ContentSafetyOptions>>();
        ILogger<ContentSafetyEnforcingAgentCompletionClient> contentSafetyCompletionLogger =
            sp.GetRequiredService<ILogger<ContentSafetyEnforcingAgentCompletionClient>>();

        IAgentCompletionClient azureCompletionEnvelope = new ContentSafetyEnforcingAgentCompletionClient(
            inner,
            contentSafetyGuard,
            contentSafetyOpts,
            contentSafetyCompletionLogger);

        LlmTokenQuotaWindowTracker quotaTracker = sp.GetRequiredService<LlmTokenQuotaWindowTracker>();
        IScopeContextProvider scopeProvider = sp.GetRequiredService<IScopeContextProvider>();
        IOptionsMonitor<LlmTokenQuotaOptions> quotaOpts = sp.GetRequiredService<IOptionsMonitor<LlmTokenQuotaOptions>>();
        IOptionsMonitor<LlmTelemetryLabelOptions> labelTelemetryOpts =
            sp.GetRequiredService<IOptionsMonitor<LlmTelemetryLabelOptions>>();
        IOptionsMonitor<LlmPromptRedactionOptions> redactionOpts =
            sp.GetRequiredService<IOptionsMonitor<LlmPromptRedactionOptions>>();
        IPromptRedactor promptRedactor = sp.GetRequiredService<IPromptRedactor>();
        IUsageMeteringService usageMetering = sp.GetRequiredService<IUsageMeteringService>();
        IOptionsMonitor<LlmDailyTenantTokenWindowOptions> dailyBudgetOpts =
            sp.GetRequiredService<IOptionsMonitor<LlmDailyTenantTokenWindowOptions>>();
        LlmDailyTenantBudgetTracker dailyBudgetTracker = sp.GetRequiredService<LlmDailyTenantBudgetTracker>();
        IOptionsMonitor<LlmJudgeDailyTokenBudgetOptions> judgeDailyBudgetOpts =
            sp.GetRequiredService<IOptionsMonitor<LlmJudgeDailyTokenBudgetOptions>>();
        LlmJudgeDailyTokenBudgetTracker judgeDailyBudgetTracker = sp.GetRequiredService<LlmJudgeDailyTokenBudgetTracker>();
        IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> monthlyDollarOpts =
            sp.GetRequiredService<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>>();
        LlmMonthlyTenantDollarBudgetTracker monthlyDollarTracker =
            sp.GetRequiredService<LlmMonthlyTenantDollarBudgetTracker>();
        IAuditService auditService = sp.GetRequiredService<IAuditService>();
        ILogger<LlmCompletionAccountingClient> accountingLogger =
            sp.GetRequiredService<ILogger<LlmCompletionAccountingClient>>();

        IAgentCompletionClient completionPipeline = new LlmCompletionAccountingClient(
            azureCompletionEnvelope,
            quotaTracker,
            scopeProvider,
            quotaOpts,
            llmTelemetryOptions,
            labelTelemetryOpts,
            redactionOpts,
            promptRedactor,
            usageMetering,
            dailyBudgetOpts,
            dailyBudgetTracker,
            monthlyDollarOpts,
            monthlyDollarTracker,
            sp.GetRequiredService<ILlmCostEstimator>(),
            sp.GetRequiredService<IAiBudgetPreCallGuard>(),
            sp.GetRequiredService<IDemoAiPromptCache>(),
            sp.GetRequiredService<IOptionsMonitor<AiUsageControlsOptions>>(),
            auditService,
            accountingLogger,
            useJudgeDailyCapOnly: true,
            judgeDailyBudgetOptions: judgeDailyBudgetOpts,
            judgeDailyBudgetTracker: judgeDailyBudgetTracker);

        CircuitBreakerGate gate = sp.GetRequiredKeyedService<CircuitBreakerGate>(OpenAiCircuitBreakerKeys.Completion);
        ILogger<CircuitBreakingAgentCompletionClient> breakerLogger =
            sp.GetRequiredService<ILogger<CircuitBreakingAgentCompletionClient>>();
        AgentExecutionResilienceOptions resOpts =
            sp.GetRequiredService<IOptions<AgentExecutionResilienceOptions>>().Value;

        resOpts.Normalize();
        AzureOpenAiOptions azureOpenAiOptions = sp.GetRequiredService<IOptions<AzureOpenAiOptions>>().Value;
        int maxRetryAttempts = ResolveLlmMaxRetryAttempts(azureOpenAiOptions, resOpts);

        ResiliencePipeline llmRetry = LlmCallResilienceDefaults.BuildLlmRetryPipeline(
            logger: breakerLogger,
            maxRetryAttempts: maxRetryAttempts,
            baseDelay: TimeSpan.FromMilliseconds(resOpts.LlmCallBaseDelayMilliseconds),
            maxDelay: TimeSpan.FromSeconds(resOpts.LlmCallMaxDelaySeconds),
            gateName: gate.GateName);

        return new BatchRoutingAgentCompletionClient(
            new CircuitBreakingAgentCompletionClient(completionPipeline, gate, llmRetry, breakerLogger),
            sp.GetRequiredService<IBatchAgentCompletionClient>(),
            sp.GetRequiredService<IOptionsMonitor<LlmBatchOptions>>(),
            sp.GetRequiredService<ILlmBatchRoutingContext>(),
            sp.GetRequiredService<ILogger<BatchRoutingAgentCompletionClient>>(),
            static options => options.RouteOfflineFaithfulnessJudge);
    }

    private static void RegisterLlmBatchServices(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<LlmBatchOptions>(configuration.GetSection(LlmBatchOptions.SectionPath));
        services.PostConfigure<LlmBatchOptions>(static options =>
        {
            options.PollIntervalSeconds = Math.Clamp(options.PollIntervalSeconds, 5, 300);
            options.MaxWaitMinutes = Math.Clamp(options.MaxWaitMinutes, 1, 1_440);
            options.EstimatedDiscountRatio = Math.Clamp(options.EstimatedDiscountRatio, 0.0, 1.0);
        });
        services.AddSingleton<ILlmBatchRoutingContext>(_ => LlmBatchRoutingContext.Instance);
        services.AddHttpClient(
            AzureOpenAiBatchHttpClients.BatchHttpClientName,
            static (sp, client) =>
            {
                IConfiguration config = sp.GetRequiredService<IConfiguration>();
                string? apiKey = config["AzureOpenAI:ApiKey"];

                if (!string.IsNullOrWhiteSpace(apiKey))
                    client.DefaultRequestHeaders.Add("api-key", apiKey);

                client.Timeout = TimeSpan.FromHours(3);
            })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.LlmCompletion);
        services.AddSingleton<IBatchAgentCompletionClient>(static sp =>
        {
            IConfiguration config = sp.GetRequiredService<IConfiguration>();
            LlmBatchOptions batchOptions = config.GetSection(LlmBatchOptions.SectionPath).Get<LlmBatchOptions>()
                                           ?? new LlmBatchOptions();

            if (!batchOptions.Enabled)
                return DisabledBatchAgentCompletionClient.Instance;

            string endpoint = config["AzureOpenAI:Endpoint"]?.Trim()
                              ?? throw new InvalidOperationException("AzureOpenAI:Endpoint is missing.");
            string deploymentName = config["AzureOpenAI:DeploymentName"]?.Trim()
                                    ?? throw new InvalidOperationException("AzureOpenAI:DeploymentName is missing.");
            string authenticationMode = config["AzureOpenAI:AuthenticationMode"]?.Trim() ?? "ApiKey";
            string? apiKey = config["AzureOpenAI:ApiKey"];

            if (string.Equals(authenticationMode, "ManagedIdentity", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "ArchLucid:LlmBatch requires ApiKey authentication today; ManagedIdentity batch transport is not implemented.");
            }

            if (string.IsNullOrWhiteSpace(apiKey))
                throw new InvalidOperationException("AzureOpenAI:ApiKey is missing.");

            IAzureOpenAiBatchTransport transport = new AzureOpenAiBatchHttpTransport(
                sp.GetRequiredService<IHttpClientFactory>(),
                endpoint,
                sp.GetRequiredService<ILogger<AzureOpenAiBatchHttpTransport>>());

            return new AzureOpenAiBatchCompletionClient(
                transport,
                deploymentName,
                sp.GetRequiredService<IOptionsMonitor<LlmBatchOptions>>(),
                sp.GetRequiredService<ILlmCostEstimator>(),
                TimeProvider.System,
                sp.GetRequiredService<ILogger<AzureOpenAiBatchCompletionClient>>());
        });
    }

    private static IAgentCompletionClient BuildAzureOpenAiScopedCompletionChain(
        IServiceProvider sp,
        AzureOpenAiCompletionClient azureInner,
        CircuitBreakerGate gate,
        string cachingDeploymentLabel)
    {
        IAgentCompletionClient completionPipeline =
            BuildAzureOpenAiScopedCompletionChainCore(sp, azureInner, cachingDeploymentLabel);

        ILogger<CircuitBreakingAgentCompletionClient> logger =
            sp.GetRequiredService<ILogger<CircuitBreakingAgentCompletionClient>>();
        AgentExecutionResilienceOptions resOpts =
            sp.GetRequiredService<IOptions<AgentExecutionResilienceOptions>>().Value;
        resOpts.Normalize();
        AzureOpenAiOptions azureOpenAiOptions = sp.GetRequiredService<IOptions<AzureOpenAiOptions>>().Value;
        int maxRetryAttempts = ResolveLlmMaxRetryAttempts(azureOpenAiOptions, resOpts);

        ResiliencePipeline llmRetry = LlmCallResilienceDefaults.BuildLlmRetryPipeline(
            logger: logger,
            maxRetryAttempts: maxRetryAttempts,
            baseDelay: TimeSpan.FromMilliseconds(resOpts.LlmCallBaseDelayMilliseconds),
            maxDelay: TimeSpan.FromSeconds(resOpts.LlmCallMaxDelaySeconds),
            gateName: gate.GateName);

        return new CircuitBreakingAgentCompletionClient(completionPipeline, gate, llmRetry, logger);
    }

    /// <summary>
    ///     Schema remediation completions share accounting and safety envelopes but omit the Polly retry stack (TB-043).
    /// </summary>
    private static IAgentCompletionClient BuildAzureOpenAiScopedCompletionChainWithoutPollyRetry(
        IServiceProvider sp,
        AzureOpenAiCompletionClient azureInner,
        string cachingDeploymentLabel) =>
        BuildAzureOpenAiScopedCompletionChainCore(sp, azureInner, cachingDeploymentLabel);

    private static IAgentCompletionClient BuildAzureOpenAiScopedCompletionChainCore(
        IServiceProvider sp,
        AzureOpenAiCompletionClient azureInner,
        string cachingDeploymentLabel)
    {
        LlmTokenQuotaWindowTracker quotaTracker = sp.GetRequiredService<LlmTokenQuotaWindowTracker>();
        IScopeContextProvider scopeProvider = sp.GetRequiredService<IScopeContextProvider>();
        IOptionsMonitor<LlmTokenQuotaOptions> quotaOpts = sp.GetRequiredService<IOptionsMonitor<LlmTokenQuotaOptions>>();
        IOptionsMonitor<LlmTelemetryOptions> telemetryOpts =
            sp.GetRequiredService<IOptionsMonitor<LlmTelemetryOptions>>();
        IOptionsMonitor<LlmTelemetryLabelOptions> labelTelemetryOpts =
            sp.GetRequiredService<IOptionsMonitor<LlmTelemetryLabelOptions>>();
        IOptionsMonitor<LlmPromptRedactionOptions> redactionOpts =
            sp.GetRequiredService<IOptionsMonitor<LlmPromptRedactionOptions>>();
        IPromptRedactor promptRedactor = sp.GetRequiredService<IPromptRedactor>();
        IUsageMeteringService usageMetering = sp.GetRequiredService<IUsageMeteringService>();
        IOptionsMonitor<LlmDailyTenantTokenWindowOptions> dailyBudgetOpts =
            sp.GetRequiredService<IOptionsMonitor<LlmDailyTenantTokenWindowOptions>>();
        LlmDailyTenantBudgetTracker dailyBudgetTracker = sp.GetRequiredService<LlmDailyTenantBudgetTracker>();
        IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> monthlyDollarOpts =
            sp.GetRequiredService<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>>();
        LlmMonthlyTenantDollarBudgetTracker monthlyDollarTracker =
            sp.GetRequiredService<LlmMonthlyTenantDollarBudgetTracker>();
        IAuditService auditService = sp.GetRequiredService<IAuditService>();
        ILogger<LlmCompletionAccountingClient> accountingLogger =
            sp.GetRequiredService<ILogger<LlmCompletionAccountingClient>>();

        IContentSafetyGuard contentSafetyGuard = sp.GetRequiredService<IContentSafetyGuard>();
        IOptionsMonitor<ContentSafetyOptions> contentSafetyOpts =
            sp.GetRequiredService<IOptionsMonitor<ContentSafetyOptions>>();
        ILogger<ContentSafetyEnforcingAgentCompletionClient> contentSafetyCompletionLogger =
            sp.GetRequiredService<ILogger<ContentSafetyEnforcingAgentCompletionClient>>();

        IAgentCompletionClient azureCompletionEnvelope = new ContentSafetyEnforcingAgentCompletionClient(
            azureInner,
            contentSafetyGuard,
            contentSafetyOpts,
            contentSafetyCompletionLogger);

        IAgentCompletionClient contextGuardedEnvelope = new ContextLengthGuardAgentCompletionClient(
            azureCompletionEnvelope,
            sp.GetRequiredService<ITokenCounter>(),
            sp.GetRequiredService<IOptionsMonitor<LlmContextWindowOptions>>(),
            sp.GetRequiredService<IOptionsMonitor<EvidenceSummarizationOptions>>(),
            sp.GetRequiredService<IEvidenceSummarizationService>(),
            auditService,
            scopeProvider,
            sp.GetRequiredService<ILogger<ContextLengthGuardAgentCompletionClient>>());

        IAgentCompletionClient completionPipeline = new LlmCompletionAccountingClient(
            contextGuardedEnvelope,
            quotaTracker,
            scopeProvider,
            quotaOpts,
            telemetryOpts,
            labelTelemetryOpts,
            redactionOpts,
            promptRedactor,
            usageMetering,
            dailyBudgetOpts,
            dailyBudgetTracker,
            monthlyDollarOpts,
            monthlyDollarTracker,
            sp.GetRequiredService<ILlmCostEstimator>(),
            sp.GetRequiredService<IAiBudgetPreCallGuard>(),
            sp.GetRequiredService<IDemoAiPromptCache>(),
            sp.GetRequiredService<IOptionsMonitor<AiUsageControlsOptions>>(),
            auditService,
            accountingLogger);

        IConfiguration config = sp.GetRequiredService<IConfiguration>();
        bool modernCompletionCacheEnabled = IsAgentRuntimeCompletionCacheEnabled(config);

        completionPipeline =
            WrapWithAgentRuntimeCompletionCacheIfEnabled(sp, completionPipeline, simulatorMode: false);

        LlmCompletionResponseCacheOptions cacheOptions = config
                                                           .GetSection(LlmCompletionResponseCacheOptions.SectionName)
                                                           .Get<LlmCompletionResponseCacheOptions>()
                                                       ?? new LlmCompletionResponseCacheOptions();

        if (cacheOptions.Enabled && !modernCompletionCacheEnabled)
        {
            TimeSpan ttl = TimeSpan.FromSeconds(Math.Max(1, cacheOptions.AbsoluteExpirationSeconds));
            ILlmCompletionResponseStore store = sp.GetRequiredService<ILlmCompletionResponseStore>();
            ILogger<CachingAgentCompletionClient> cacheLogger =
                sp.GetRequiredService<ILogger<CachingAgentCompletionClient>>();
            completionPipeline = new CachingAgentCompletionClient(
                completionPipeline,
                store,
                cachingDeploymentLabel,
                enabled: true,
                partitionByScope: cacheOptions.PartitionByScope,
                absoluteExpiration: ttl,
                scopeProvider: scopeProvider,
                logger: cacheLogger);
        }

        return completionPipeline;
    }

    private static void RegisterSchemaRemediationAgentCompletionClient(IServiceCollection services, bool useAzureOpenAi)
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
                    BuildAzureOpenAiScopedCompletionChainWithoutPollyRetry(sp, azureInner, effectiveDeployment);

                return new SchemaRemediationAgentCompletionClientAdapter(client, aliasResolver);
            }

            IAgentTierCompletionRouter router = sp.GetRequiredService<IAgentTierCompletionRouter>();
            IAgentModelAliasResolver passThroughAliasResolver = sp.GetRequiredService<IAgentModelAliasResolver>();
            (IAgentCompletionClient remediation, _) =
                router.ResolveForAgent(AgentType.Topology, LlmModelTier.Economy);

            return new SchemaRemediationAgentCompletionClientAdapter(remediation, passThroughAliasResolver);
        });
    }

    private static int ResolveLlmMaxRetryAttempts(
        AzureOpenAiOptions azureOpenAiOptions,
        AgentExecutionResilienceOptions resOpts)
    {
        ArgumentNullException.ThrowIfNull(azureOpenAiOptions);
        ArgumentNullException.ThrowIfNull(resOpts);

        if (azureOpenAiOptions.MaxRetries > 0)
            return azureOpenAiOptions.MaxRetries;

        return resOpts.LlmCallMaxRetryAttempts;
    }

    private static BinaryData? ResolveStructuredOutputAgentResultSchema(
        IConfiguration configuration,
        AzureOpenAiOptions azureOpenAiOptions)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(azureOpenAiOptions);

        if (!azureOpenAiOptions.UseJsonSchemaResponseFormat)
            return null;

        SchemaValidationOptions parsed =
            configuration.GetSection(SchemaValidationOptions.SectionName).Get<SchemaValidationOptions>()
            ?? new SchemaValidationOptions();

        string relative = parsed.AgentResultSchemaPath.Trim();

        if (string.IsNullOrEmpty(relative))
            relative = new SchemaValidationOptions().AgentResultSchemaPath;

        string fullPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, relative));

        if (!File.Exists(fullPath))
            throw new InvalidOperationException(
                "AzureOpenAI:UseJsonSchemaResponseFormat is true but the agent result schema file was not found on disk at '"
                + fullPath + "' (SchemaValidation:AgentResultSchemaPath is '" + relative + "').");

        return BinaryData.FromString(File.ReadAllText(fullPath));
    }

    private static void RegisterAgentModelTierOrchestration(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<AgentModelTierOptions>(configuration.GetSection(AgentModelTierOptions.SectionPath));
        services.PostConfigure<AgentModelTierOptions>(static opts => AgentModelTierDefaults.ApplyDefaults(opts));
        services.AddSingleton<IAgentModelTierResolver, AgentModelTierResolver>();
        services.AddSingleton<IAgentModelAliasRegistry, ConfigAgentModelAliasRegistry>();
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
