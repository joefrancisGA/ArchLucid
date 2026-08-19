using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.Diagnostics;
using ArchLucid.Api.Health;
using ArchLucid.Host.Core.Health;
using ArchLucid.Api.Middleware;
using ArchLucid.Api.Startup;
using ArchLucid.Api.Services;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Api.Services.Evolution;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Admin;
using ArchLucid.Application.Analytics;
using ArchLucid.Application.AzureExtractor;
using ArchLucid.Core.Admin;
using ArchLucid.Application.AwsExtractor;
using ArchLucid.Application.GcpExtractor;
using ArchLucid.Mcp.Tools;
using ArchLucid.Application.Import;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Http;
using ArchLucid.Host.Composition.Startup;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Http;
using ArchLucid.Host.Core.Services.Governance;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Configuration;

/// <summary>
///     HTTP/API-only DI registrations that depend on API-layer models (product learning read models, evolution
///     simulation).
/// </summary>
/// <remarks>
///     The Worker host does not register these services; it does not expose Learning/Evolution controllers.
/// </remarks>
public static class ApiWebLayerServiceCollectionExtensions
{
    public static IServiceCollection AddArchLucidApiWebLayerServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArchLucidOptions options = ArchLucidConfigurationBridge.ResolveArchLucidOptions(configuration);

        if (ArchLucidOptions.EffectiveIsInMemory(options.StorageProvider))
        {
            services.AddSingleton<ILearningPlanningReadService, LearningPlanningReadService>();
            services.AddScoped<IEvolutionSimulationService, EvolutionSimulationService>();
        }
        else
        {
            services.AddScoped<ILearningPlanningReadService, LearningPlanningReadService>();
            services.AddScoped<IEvolutionSimulationService, EvolutionSimulationService>();
        }

        services.AddScoped<IAdminDiagnosticsService, AdminDiagnosticsService>();
        services.AddSingleton<IHostBuildInfoAccessor, ApiHostBuildInfoAccessor>();
        services.Configure<DeploymentStatusOptions>(configuration.GetSection(DeploymentStatusOptions.SectionPath));
        services.AddScoped<IAdminDeploymentStatusQuery, AdminDeploymentStatusQuery>();
        services.AddSingleton<ICacheTelemetrySnapshotProvider>(static sp =>
        {
            IOptionsMonitor<KnowledgeGraphProjectionCacheOptions>? projectionOptions =
                sp.GetService<IOptionsMonitor<KnowledgeGraphProjectionCacheOptions>>();

            if (projectionOptions is null)
                return new CacheTelemetrySnapshotProvider();

            return new CacheTelemetrySnapshotProvider(() => projectionOptions.CurrentValue.Enabled);
        });
        services.AddScoped<IAdminApiKeySettingsService, AdminApiKeySettingsService>();
        services.AddScoped<ITokenClaimsDiagnosticService, TokenClaimsDiagnosticService>();
        services.AddHttpClient<IOidcWellKnownDiagnosticsService, OidcWellKnownDiagnosticsService>(static client =>
        {
            client.Timeout = TimeSpan.FromSeconds(10);
        })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration);
        services.AddHttpClient<ISamlOperationalDiagnosticsService, SamlOperationalDiagnosticsService>(static client =>
        {
            client.Timeout = TimeSpan.FromSeconds(10);
        })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration);
        services.AddHttpClient<IIdentityProviderDiscoveryService, IdentityProviderDiscoveryService>(static client =>
        {
            client.Timeout = TimeSpan.FromSeconds(15);
        })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration);
        services.AddScoped<ISsoWizardTestLoginService, SsoWizardTestLoginService>();
        services.AddScoped<IIdentityProviderActivationService, IdentityProviderActivationService>();
        services.AddScoped<ApiRequestMeteringMiddleware>();
        services.AddScoped<LlmTokenUsageResponseMiddleware>();
        services.AddSingleton<ILocalTrialJwtIssuer, LocalTrialJwtIssuer>();
        services.AddScoped<PlatformUserAuthVersionValidator>();
        services.AddScoped<IAuthenticatedPlatformUserResolver, AuthenticatedPlatformUserResolver>();
        services.AddScoped<IArchitectureRequestImportValidator, FluentArchitectureRequestImportValidator>();
        services.AddScoped<IImportRequestFileService, ImportRequestFileService>();
        services.AddScoped<IArchitectureDefinitionCsvImportDryRunService, ArchitectureDefinitionCsvImportDryRunService>();
        services.AddHostedAzureExtractorIntegrationServices(configuration);
        services.AddHostedAwsExtractorIntegrationServices(configuration);
        services.AddHostedGcpExtractorIntegrationServices(configuration);
        services.AddCloudInventoryExtractorIngestServices();
        services.AddScoped<ITier2ConnectionService, Tier2ConnectionService>();
        services.AddScoped<IAwsTier2ConnectionService, AwsTier2ConnectionService>();
        services.AddScoped<IGcpTier2ConnectionService, GcpTier2ConnectionService>();
        services.AddScoped<IPatternInsightsService, PatternInsightsService>();
        services.AddScoped<RetrievalTools>();
        services.AddScoped<PolicyPackMarkdownExplainService>();

        services
            .AddHttpClient<IOutboundWebhookDryRunService, OutboundWebhookDryRunService>(static client =>
            {
                client.Timeout = TimeSpan.FromSeconds(30);
            })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration);
        services.AddScoped<IWebhookSubscriptionTestService, WebhookSubscriptionTestService>();

        services.AddHealthChecks().AddCheck<AzureServiceBusNamespaceHealthCheck>(
            "azure_service_bus",
            failureStatus: HealthStatus.Unhealthy,
            tags: [ReadinessTags.Ready])
            .AddCheck<KeyVaultConnectivityHealthCheck>(
                "azure_key_vault_connectivity",
                failureStatus: HealthStatus.Unhealthy,
                tags: [ReadinessTags.Ready])
            .AddCheck<StartupDatabaseMigrationHealthCheck>(
                "startup_database_migration",
                failureStatus: HealthStatus.Unhealthy,
                tags: [ReadinessTags.Ready])
            .AddCheck<ContentSafetyHealthCheck>(
                "azure_content_safety",
                failureStatus: HealthStatus.Unhealthy,
                tags: [ReadinessTags.Ready]);

        return services;
    }
}
