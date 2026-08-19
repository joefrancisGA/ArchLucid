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
        services.Configure<TopologyProposalConsensusOptions>(
            configuration.GetSection(TopologyProposalConsensusOptions.SectionPath));
        services.Configure<AgentCuratedEvidenceProposalOptions>(
            configuration.GetSection(AgentCuratedEvidenceProposalOptions.SectionPath));
        services.AddScoped<IAgentConfidenceCalibrator, AgentConfidenceCalibrator>();
        services.AddScoped<IAgentConfidenceCalibrationService, AgentConfidenceCalibrationService>();
        services.AddScoped<IPromptVariantStatsService, PromptVariantStatsService>();
        services.AddScoped<IAgentCuratedEvidenceProposer, AgentCuratedEvidenceProposer>();
        services.AddScoped<AgentResultPostExecutionEnricher>();
        services.AddScoped<AgentResultRegionMismatchEnricher>();
        services.AddScoped<AgentProposalStructuralPostProcessorEnricher>();
        services.AddScoped<CrossAgentProposalConsistencyEnricher>();
        services.AddScoped<TopologyProposalDualModelConsensusEnricher>();
        services.AddScoped<AgentArchitectureFindingEmissionEnricher>();
        services.AddScoped<IAgentResultPostExecutionEnricher>(static sp =>
            new CompositeAgentResultPostExecutionEnricher(
            [
                sp.GetRequiredService<AgentResultPostExecutionEnricher>(),
                sp.GetRequiredService<AgentProposalStructuralPostProcessorEnricher>(),
                sp.GetRequiredService<CrossAgentProposalConsistencyEnricher>(),
                sp.GetRequiredService<TopologyProposalDualModelConsensusEnricher>(),
                sp.GetRequiredService<AgentArchitectureFindingEmissionEnricher>(),
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
            services.AddScoped<ITopologyProposalSecondaryCompletionInvoker, NullTopologyProposalSecondaryCompletionInvoker>();
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
        services.AddSingleton<IQuickScanUsageRecorder, QuickScanUsageRecorder>();
        services.AddSingleton<IQuickScanBudgetMonitoringService, QuickScanBudgetMonitoringService>();
        services.AddScoped<IQuickScanExecutionOrchestrator, QuickScanExecutionOrchestrator>();
        services.AddScoped<IQuickScanService, QuickScanService>();
        services.AddScoped<IRegisteredAgentHandlersInspector, RegisteredAgentHandlersInspector>();
    }
}
