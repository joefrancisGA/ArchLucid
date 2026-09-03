using ArchLucid.AgentRuntime.Caching;
using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.AgentRuntime.Prompts.Variants;
using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.AgentRuntime.Tokens;
using ArchLucid.AgentRuntime;
using ArchLucid.Application.Budgeting;
using ArchLucid.Contracts.Persistence.Agents.PromptVariants;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Resilience;
using ArchLucid.Host.Composition.AzureOpenAI;
using ArchLucid.Host.Core.Resilience;
using ArchLucid.Host.Core.Services;
using ArchLucid.Host.Core.Startup;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

partial class AgentLlmSupportCompositionModule
{
    private static void RegisterPromptAndTokenInfrastructure(
        IServiceCollection services,
        IConfiguration configuration)
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
    }
}
