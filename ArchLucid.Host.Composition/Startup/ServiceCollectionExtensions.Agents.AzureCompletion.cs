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
}
