using ArchLucid.AgentRuntime.Batch;
using ArchLucid.AgentRuntime.Safety;
using ArchLucid.AgentRuntime;
using ArchLucid.Application.Budgeting;
using ArchLucid.Core.Agents;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Resilience;
using ArchLucid.Core.Safety;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Composition.AzureOpenAI;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Resilience;
using IAgentCompletionClient = ArchLucid.AgentRuntime.IAgentCompletionClient;
using Microsoft.Extensions.Options;
using Polly;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

internal static class AgentCompletionJudgeChainRegistrar
{
    /// <summary>
    ///     Judge-only chain: non-schema Azure JSON completions + content safety + accounting with the isolated judge UTC-day token
    ///     pool (not the run-execution daily cap). Omits completion response caching and per-run cost guard (agent batch only).
    /// </summary>
    internal static IAgentCompletionClient BuildAgentOutputSemanticJudgeCompletionChain(IServiceProvider sp)
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
        ILlmCompletionOutputTruncationReporter truncationReporter =
            sp.GetRequiredService<ILlmCompletionOutputTruncationReporter>();

        AzureOpenAiCompletionClient inner = useManagedIdentity
            ? AzureOpenAiCompletionClient.CreateWithManagedIdentity(
                endpoint,
                deployment,
                maxTok,
                structuredOutputAgentResultSchema: null,
                completionLogger,
                llmTelemetryOptions,
                truncationReporter)
            : new AzureOpenAiCompletionClient(
                endpoint,
                apiKey,
                deployment,
                maxTok,
                structuredOutputAgentResultSchema: null,
                completionLogger,
                llmTelemetryOptions,
                truncationReporter);

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
        IOptionsMonitor<LlmPromptRedactionOptions> redactionOpts =
            sp.GetRequiredService<IOptionsMonitor<LlmPromptRedactionOptions>>();
        IPromptRedactor promptRedactor = sp.GetRequiredService<IPromptRedactor>();
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
        LlmCompletionAccountingTelemetry accountingTelemetry =
            sp.GetRequiredService<LlmCompletionAccountingTelemetry>();

        IAgentCompletionClient completionPipeline = new LlmCompletionAccountingClient(
            azureCompletionEnvelope,
            quotaTracker,
            scopeProvider,
            quotaOpts,
            accountingTelemetry,
            redactionOpts,
            promptRedactor,
            dailyBudgetOpts,
            dailyBudgetTracker,
            monthlyDollarOpts,
            monthlyDollarTracker,
            sp.GetRequiredService<ILlmCostEstimator>(),
            sp.GetRequiredService<IAiBudgetPreCallGuard>(),
            sp.GetRequiredService<IDemoAiPromptCache>(),
            sp.GetRequiredService<IOptionsMonitor<AiUsageControlsOptions>>(),
            auditService,
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
        int maxRetryAttempts = AgentCompletionResolutionHelper.ResolveLlmMaxRetryAttempts(azureOpenAiOptions, resOpts);

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
