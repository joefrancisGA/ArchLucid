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
                accountingLogger,
                spendCapPolicy: sp.GetRequiredService<IAgentLogicalStepSpendCapPolicy>());

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
            judgeDailyBudgetTracker: judgeDailyBudgetTracker,
            spendCapPolicy: sp.GetRequiredService<IAgentLogicalStepSpendCapPolicy>());

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
}
