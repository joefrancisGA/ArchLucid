using ArchLucid.Application.AiProviders;
using ArchLucid.Application.Billing;
using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Bootstrap.Seeders;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Integrations;
using ArchLucid.Application.Integrations.AzureBoards;
using ArchLucid.Application.Integrations.AzureBoards.Outbound;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Integrations.Itsm.OAuth;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Application.Reporting;
using ArchLucid.Application.Templates;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Http;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Host.Composition.Configuration;
using ArchLucid.Host.Composition.Services;
using ArchLucid.Host.Composition.Startup.Modules;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Diagnostics;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Persistence.Archival;
using ArchLucid.Persistence.Integrations;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup;

/// <summary>Platform capability composition facade (tenancy, billing, integrations, SCIM).</summary>
public static partial class ServiceCollectionExtensions
{
    /// <summary>Registers platform capability services (tenancy, billing, integrations, SCIM).</summary>
    public static IServiceCollection AddPlatformCapability(
        this IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddSingleton<ExportFormatterService>();
        services.AddSingleton<TemplateProvider>();
        services.Configure<DemoOptions>(configuration.GetSection(DemoOptions.SectionName));
        services.Configure<DiagramVisionOptions>(configuration.GetSection(DiagramVisionOptions.SectionName));
        services.Configure<OutboundExternalHttpResilienceOptions>(
            configuration.GetSection(OutboundExternalHttpResilienceOptions.SectionName));
        services.PostConfigure<OutboundExternalHttpResilienceOptions>(static o => o.Normalize());
        RegisterAzureArmAndRetailPricesHttpClients(services);
        RegisterMultiCloudPublicPricingHttpClients(services);
        services.Configure<GcpBillingCatalogOptions>(configuration.GetSection(GcpBillingCatalogOptions.SectionName));
        services.AddScoped<Application.Diagnostics.ISyntheticOperatorDemoPackWriter,
            Application.Diagnostics.SyntheticOperatorDemoPackWriter>();

        ArchLucidOptions archLucidOptionsForDiagnostics =
            ArchLucidConfigurationBridge.ResolveArchLucidOptions(configuration);

        if (ArchLucidOptions.EffectiveIsSql(archLucidOptionsForDiagnostics.StorageProvider))
        {
            services.AddScoped<Application.Diagnostics.IDevelopmentCatalogResetService,
                DevelopmentCatalogResetService>();
        }
        else
        {
            services.AddScoped<Application.Diagnostics.IDevelopmentCatalogResetService,
                InMemoryDevelopmentCatalogResetService>();
        }

        services.Configure<ApiDeprecationOptions>(configuration.GetSection(ApiDeprecationOptions.SectionName));
        services.Configure<DataArchivalOptions>(configuration.GetSection(DataArchivalOptions.SectionName));
        services.Configure<TenantErasurePurgeOptions>(configuration.GetSection(TenantErasurePurgeOptions.SectionName));
        services.Configure<OrphanedTenantCatalogCleanupOptions>(
            configuration.GetSection(OrphanedTenantCatalogCleanupOptions.SectionName));
        services.Configure<DatabaseLivenessHealthCheckOptions>(
            configuration.GetSection(DatabaseLivenessHealthCheckOptions.SectionName));
        services.Configure<HostLeaderElectionOptions>(configuration.GetSection(HostLeaderElectionOptions.SectionName));
        services.AddDemoSeedScenarioSeeders();
        services.AddScoped<IDemoSeedService, DemoSeedService>();
        services.AddArchLucidFeatureManagement(configuration);
        services.AddArchLucidStorage(configuration);
        OperationalErrorsCompositionRegistrar.Register(services, configuration, hostingRole);
        services.AddArchLucidAiUsageControls(configuration);
        RegisterTenancyMeteringAndSecrets(services, configuration);
        services.RegisterBilling(configuration);
        RegisterAdvisoryScheduling(services, configuration, hostingRole);
        WeeklyDigestCompositionModule.Register(services, configuration, hostingRole);
        TrialLifecycleCompositionModule.Register(services, configuration, hostingRole);
        RegisterTenantHealthScoring(services, configuration, hostingRole);
        RegisterInternalCrossTenantAnalytics(services, configuration, hostingRole);
        RegisterDigestDelivery(services, configuration);
        RegisterIntegrationEventPublishing(services, configuration);
        AlertsCompositionModule.Register(services, configuration);
        RegisterIntegrationEventOutbox(services, hostingRole);
        RegisterIntegrationEventConsumer(services, configuration, hostingRole);
        RegisterAzureDevOpsCommitStatusPublisher(services, configuration);
        RegisterDataArchivalHostedService(services, configuration, hostingRole);
        RegisterFirstTenantFunnelArchivalHostedService(services, configuration, hostingRole);
        RegisterTenantErasureEligiblePurgeHostedService(services, hostingRole);
        RegisterOrphanedTenantCleanupHostedService(services, hostingRole);
        RegisterWarmTenantCatalogReplenishHostedService(services, hostingRole);
        DataHealthJobsCompositionModule.Register(services, configuration, hostingRole);
        services.Configure<SqlConnectionHealthCheckOptions>(
            configuration.GetSection(SqlConnectionHealthCheckOptions.SectionName));
        RegisterCosmosPolyglotPersistence(services, configuration, hostingRole);
        RegisterArchLucidJobRunners(services, configuration);
        services.AddFirstTenantFunnelTelemetry(configuration);
        services.Configure<IntegrationsItsmInboundOptions>(
            configuration.GetSection(IntegrationsItsmInboundOptions.SectionName));
        services.Configure<IntegrationsItsmOptions>(
            configuration.GetSection(IntegrationsItsmOptions.SectionName));
        services.Configure<IntegrationsItsmOutboundOptions>(
            configuration.GetSection(IntegrationsItsmOutboundOptions.SectionName));
        services.Configure<ConfluencePublishingOptions>(
            configuration.GetSection(ConfluencePublishingOptions.SectionName));
        RegisterIntegrationsOutboundHttpClients(services);
        services.AddSingleton<ItsmNativeIntegrationGate>();
        services.AddScoped<JiraExternalTicketConnector>();
        services.AddScoped<ServiceNowExternalTicketConnector>();
        services.AddScoped<AzureBoardsExternalTicketConnector>();
        services.AddScoped<IExternalTicketConnectorRegistry>(static sp =>
            new ExternalTicketConnectorRegistry(
            [
                sp.GetRequiredService<JiraExternalTicketConnector>(),
                sp.GetRequiredService<ServiceNowExternalTicketConnector>(),
                sp.GetRequiredService<AzureBoardsExternalTicketConnector>()
            ]));
        services.AddScoped<IItsmOutboundIntegrationHealthService, ItsmOutboundIntegrationHealthService>();
        services.AddScoped<ITenantItsmOutboundSettingsService, TenantItsmOutboundSettingsService>();
        services.AddScoped<ITenantAzureOpenAiConnectionService, TenantAzureOpenAiConnectionService>();
        services.AddScoped<ITenantAzureOpenAiConnectionProbeService, TenantAzureOpenAiConnectionProbeService>();
        services.AddScoped<Application.Diagnostics.IWorkspaceAiAvailabilityService, WorkspaceAiAvailabilityService>();
        services.AddScoped<Application.Diagnostics.IAgentExecutionReadinessGuard, AgentExecutionReadinessGuard>();
        services.AddScoped<ITeamsIncomingWebhookConnectionProbeService, TeamsIncomingWebhookConnectionProbeService>();
        services.AddScoped<IMarketplaceWebhookConnectivityService, MarketplaceWebhookConnectivityService>();
        services.AddScoped<IItsmTenantConnectorCredentialResolver, ItsmTenantConnectorCredentialResolver>();
        services.AddSingleton<IItsmInboundWebhookReplayGuard, MemoryCacheItsmInboundWebhookReplayGuard>();
        services.AddSingleton<ItsmConnectorOAuthAccessTokenCache>();
        services.AddScoped<IItsmAtlassianOAuthConsentService, ItsmAtlassianOAuthConsentService>();
        services.AddScoped<IItsmOutboundHttpAuthenticator, ItsmOutboundHttpAuthenticator>();
        services.AddScoped<IItsmOutboundIssueCreationService, ItsmOutboundIssueCreationService>();
        services.AddScoped<ItsmOutboundIssueCreationService>();
        services.AddScoped<IAzureBoardsIntegrationService, AzureBoardsIntegrationService>();
        services.AddScoped<ItsmExternalTicketUrlBuilder>();
        services.AddScoped<ItsmFindingCorrelationQueryService>();
        services.AddScoped<RunFindingExternalTrackingEnrichmentService>();
        RegisterScimProvisioning(services, configuration, hostingRole);
        RegisterCorePersistencePortCompatibilityServices(services);

        return services;
    }
}
