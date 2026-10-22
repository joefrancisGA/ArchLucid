using ArchLucid.AgentRuntime;
using ArchLucid.Application.Budgeting;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Composition.AzureOpenAI;
using ArchLucid.Host.Composition.Caching;
using IAgentCompletionClient = ArchLucid.AgentRuntime.IAgentCompletionClient;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

internal static class EchoAgentCompletionPipelineRegistrar
{
    internal static void RegisterEchoAgentCompletionPipeline(IServiceCollection services)
    {
        services.AddScoped<ScopedInnerAgentCompletionClient>(sp =>
        {
            EchoAgentCompletionClient echoInner = new();
            LlmTokenQuotaWindowTracker quotaTracker = sp.GetRequiredService<LlmTokenQuotaWindowTracker>();
            IScopeContextProvider scopeProvider = sp.GetRequiredService<IScopeContextProvider>();
            IOptionsMonitor<LlmTokenQuotaOptions> quotaOpts = sp.GetRequiredService<IOptionsMonitor<LlmTokenQuotaOptions>>();
            IOptionsMonitor<LlmPromptRedactionOptions> redactionOpts =
                sp.GetRequiredService<IOptionsMonitor<LlmPromptRedactionOptions>>();
            IPromptRedactor promptRedactor = sp.GetRequiredService<IPromptRedactor>();
            IOptionsMonitor<LlmDailyTenantTokenWindowOptions> dailyBudgetOpts =
                sp.GetRequiredService<IOptionsMonitor<LlmDailyTenantTokenWindowOptions>>();
            LlmDailyTenantBudgetTracker dailyBudgetTracker = sp.GetRequiredService<LlmDailyTenantBudgetTracker>();
            IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> monthlyDollarOpts =
                sp.GetRequiredService<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>>();
            LlmMonthlyTenantDollarBudgetTracker monthlyDollarTracker =
                sp.GetRequiredService<LlmMonthlyTenantDollarBudgetTracker>();
            IAuditService auditService = sp.GetRequiredService<IAuditService>();
            LlmCompletionAccountingTelemetry accountingTelemetry =
                sp.GetRequiredService<LlmCompletionAccountingTelemetry>();

            IAgentCompletionClient completionPipeline = new LlmCompletionAccountingClient(
                echoInner,
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
                spendCapPolicy: sp.GetRequiredService<IAgentLogicalStepSpendCapPolicy>());

            IConfiguration config = sp.GetRequiredService<IConfiguration>();

            bool modernCompletionCacheEnabled = AgentCompletionPipelineHelpers.IsAgentRuntimeCompletionCacheEnabled(config);

            completionPipeline =
                AgentCompletionPipelineHelpers.WrapWithAgentRuntimeCompletionCacheIfEnabled(
                    sp,
                    completionPipeline,
                    simulatorMode: false);

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

        AgentModelTierCompositionModule.RegisterPassThroughTierCompletionRouter(services);
        SchemaRemediationCompletionRegistrar.RegisterSchemaRemediationAgentCompletionClient(services, useAzureOpenAi: false);
        AgentModelTierCompositionModule.RegisterAgentCompletionClientFromTierRouter(services);
    }
}
