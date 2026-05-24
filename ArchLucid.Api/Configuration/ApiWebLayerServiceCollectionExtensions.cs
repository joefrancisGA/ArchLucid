using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.Health;
using ArchLucid.Host.Core.Health;
using ArchLucid.Api.Middleware;
using ArchLucid.Api.Startup;
using ArchLucid.Api.Services;
using ArchLucid.Api.Services.Billing;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Api.Services.Evolution;
using ArchLucid.Api.Validators;
using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.Import;
using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Integrations.AzureExtractor;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Services.Governance;
using ArchLucid.KnowledgeGraph.Configuration;
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
        services.AddSingleton<ICacheTelemetrySnapshotProvider>(static sp =>
        {
            IOptionsMonitor<KnowledgeGraphProjectionCacheOptions>? projectionOptions =
                sp.GetService<IOptionsMonitor<KnowledgeGraphProjectionCacheOptions>>();

            if (projectionOptions is null)
                return new CacheTelemetrySnapshotProvider();

            return new CacheTelemetrySnapshotProvider(() => projectionOptions.CurrentValue.Enabled);
        });
        services.AddScoped<IAdminApiKeySettingsService, AdminApiKeySettingsService>();
        services.AddHttpClient<IOidcWellKnownDiagnosticsService, OidcWellKnownDiagnosticsService>(static client =>
        {
            client.Timeout = TimeSpan.FromSeconds(10);
        });
        services.AddHttpClient<ISamlOperationalDiagnosticsService, SamlOperationalDiagnosticsService>(static client =>
        {
            client.Timeout = TimeSpan.FromSeconds(10);
        });
        services.AddHttpClient<IIdentityProviderDiscoveryService, IdentityProviderDiscoveryService>(static client =>
        {
            client.Timeout = TimeSpan.FromSeconds(15);
        });
        services.AddScoped<ISsoWizardTestLoginService, SsoWizardTestLoginService>();
        services.AddScoped<IIdentityProviderActivationService, IdentityProviderActivationService>();
        services.AddScoped<ApiRequestMeteringMiddleware>();
        services.AddScoped<LlmTokenUsageResponseMiddleware>();
        services.AddSingleton<ILocalTrialJwtIssuer, LocalTrialJwtIssuer>();
        services.AddScoped<IArchitectureRequestImportValidator, FluentArchitectureRequestImportValidator>();
        services.AddScoped<IImportRequestFileService, ImportRequestFileService>();
        services.AddScoped<IArchitectureDefinitionCsvImportDryRunService, ArchitectureDefinitionCsvImportDryRunService>();
        services.AddScoped<IHostedAzureExtractorConfigurationService, HostedAzureExtractorConfigurationService>();
        services.AddScoped<ITier2ConnectionService, Tier2ConnectionService>();
        services.AddScoped<IHostedAzureExtractorRunService, HostedAzureExtractorRunService>();
        services.Configure<HostedAzureExtractorOptions>(configuration.GetSection(HostedAzureExtractorOptions.SectionName));
        services.AddSingleton<IHostedAzureExtractorCredentialFactory, WorkloadIdentityHostedAzureExtractorCredentialFactory>();
        services.AddHttpClient<IHostedAzureArmReadClient, GetOnlyHostedAzureArmReadClient>(static client =>
        {
            client.Timeout = TimeSpan.FromMinutes(5);
        });
        services.AddScoped<IHostedAzureExtractorClient, HostedAzureExtractorClient>();
        services.AddScoped<IAzureExtractorIngestService, AzureExtractorIngestService>();
        services.AddScoped<AzureExtractorChunkedUploadService>();
        services.AddScoped<PolicyPackMarkdownExplainService>();

        services.AddHttpClient<IOutboundWebhookDryRunService, OutboundWebhookDryRunService>(static client =>
        {
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        services.AddScoped<IWebhookSubscriptionTestService, WebhookSubscriptionTestService>();
        services.AddScoped<MarketplaceWebhookConnectivityService>();

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
                tags: [ReadinessTags.Ready])
            .AddArchLucidRlsSessionContextInfrastructureProbe();

        return services;
    }
}
