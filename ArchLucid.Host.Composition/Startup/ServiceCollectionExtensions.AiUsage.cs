using ArchLucid.Application.AiUsage;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Startup;

internal static class ServiceCollectionExtensionsAiUsage
{
    internal static IServiceCollection AddArchLucidAiUsageControls(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<AiUsageControlsOptions>(configuration.GetSection(AiUsageControlsOptions.SectionName));
        services.AddSingleton<IPostConfigureOptions<AiUsageControlsOptions>, AiUsageControlsOptionsNormalizePostConfigure>();

        services.AddSingleton<IDemoAiPromptCache, DemoAiPromptCache>();
        services.AddScoped<ITenantAiBudgetPolicyResolver, TenantAiBudgetPolicyResolver>();
        services.AddScoped<ISelfServiceTrialAiBudgetPolicyProvisioner, SelfServiceTrialAiBudgetPolicyProvisioner>();
        services.AddScoped<ITenantLlmMonthlyBudgetCapResolver, TenantLlmMonthlyBudgetCapResolver>();
        services.AddScoped<IAiBudgetPreCallGuard, AiBudgetPreCallGuard>();
        services.AddScoped<DemoExpensiveActionGate>();

        return services;
    }
}
