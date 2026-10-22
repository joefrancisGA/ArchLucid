using ArchLucid.AgentRuntime.QuickScan;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Architecture.Execute;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Budgeting;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Http;
using ArchLucid.Host.Core.Http;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

partial class AgentExecutionCompositionModule
{
    private static void RegisterQuickScan(IServiceCollection services, IConfiguration configuration)
    {
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
        services.AddScoped<IQuickScanExecutionPreExecuteStage, QuickScanExecutionPreExecuteStage>();
        services.AddScoped<IQuickScanExecutionBudgetAndConcurrencyStage, QuickScanExecutionBudgetAndConcurrencyStage>();
        services.AddScoped<IQuickScanExecutionScanInvokeStage, QuickScanExecutionScanInvokeStage>();
        services.AddScoped<IQuickScanExecutionUsageAndAuditStage, QuickScanExecutionUsageAndAuditStage>();
        services.AddScoped<IQuickScanExecutionOrchestrator, QuickScanExecutionOrchestrator>();
        services.AddScoped<IQuickScanService, QuickScanService>();
        services.AddScoped<IRegisteredAgentHandlersInspector, RegisteredAgentHandlersInspector>();
    }
}
