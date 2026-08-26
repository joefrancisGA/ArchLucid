// Alerts bounded-context composition registrations.

using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Decisioning.Alerts;
using ArchLucid.Decisioning.Alerts.Composite;
using ArchLucid.Decisioning.Alerts.Delivery;
using ArchLucid.Decisioning.Alerts.Tuning;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.Resolution;
using ArchLucid.Host.Composition.Alerts;
using ArchLucid.Host.Core.Services;
using ArchLucid.Host.Core.Services.Governance;
using ArchLucid.Notifications.Alerts;
using ArchLucid.Persistence.Alerts;
using ArchLucid.Persistence.Alerts.Simulation;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Governance;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;


namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>
/// Alert evaluation, delivery, composite rules, and policy-pack resolver DI registrations.
/// </summary>
public static class AlertsCompositionModule
{
    /// <summary>
    /// Registers alert evaluation, delivery channels, composite rules, and policy-pack services.
    /// </summary>
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
        _ = configuration;
        RegisterAlerts(services);
    }

    private static void RegisterAlerts(IServiceCollection services)
    {
        services.AddScoped<ArchLucid.Core.Alerts.IAlertEvaluator, AlertEvaluator>();
        services.AddScoped<IAlertDeliveryChannel, AlertEmailDeliveryChannel>();
        services.AddScoped<IAlertDeliveryChannel, AlertTeamsWebhookDeliveryChannel>();
        services.AddScoped<IAlertDeliveryChannel, AlertSlackWebhookDeliveryChannel>();
        services.AddScoped<IAlertDeliveryChannel, AlertOnCallWebhookDeliveryChannel>();
        services.AddScoped<IAlertDeliveryDispatcher, AlertDeliveryDispatcher>();
        services.AddScoped<ArchLucid.Core.Alerts.IAlertService, AlertService>();
        services.AddScoped<ArchLucid.Decisioning.Alerts.IAlertService>(static sp =>
            new AlertServiceDecisioningPortAdapter(sp.GetRequiredService<ArchLucid.Core.Alerts.IAlertService>()));

        services.AddScoped<ArchLucid.Core.Alerts.Composite.IAlertMetricSnapshotBuilder, AlertMetricSnapshotBuilder>();
        services.AddScoped<ArchLucid.Core.Alerts.Composite.ICompositeAlertRuleEvaluator, CompositeAlertRuleEvaluator>();
        services.AddScoped<ArchLucid.Core.Alerts.Composite.IAlertSuppressionPolicy, AlertSuppressionPolicy>();
        services.AddScoped<ArchLucid.Core.Alerts.Composite.ICompositeAlertService, CompositeAlertService>();
        services.AddScoped<ArchLucid.Decisioning.Alerts.Composite.ICompositeAlertService>(static sp =>
            new CompositeAlertServiceDecisioningPortAdapter(sp.GetRequiredService<ArchLucid.Core.Alerts.Composite.ICompositeAlertService>()));

        services.AddScoped<ArchLucid.Core.Alerts.Simulation.IAlertSimulationContextProvider, AlertSimulationContextProvider>();
        services.AddScoped<ArchLucid.Core.Alerts.Simulation.IRuleSimulationService, RuleSimulationService>();
        services.AddScoped<ArchLucid.Decisioning.Alerts.Simulation.IRuleSimulationService>(static sp =>
            new RuleSimulationServiceDecisioningPortAdapter(sp.GetRequiredService<ArchLucid.Core.Alerts.Simulation.IRuleSimulationService>()));

        services.AddScoped<IAlertNoiseScorer, AlertNoiseScorer>();
        services.AddScoped<ArchLucid.Core.Alerts.Tuning.IThresholdRecommendationService, ThresholdRecommendationService>();
        services.AddScoped<IThresholdRecommendationService, ThresholdRecommendationService>();

        services.AddScoped<PolicyPackResolver>();
        services.AddScoped<CachingPolicyPackResolver>(static sp =>
            new CachingPolicyPackResolver(
                sp.GetRequiredService<PolicyPackResolver>(),
                sp.GetRequiredService<IHotPathReadCache>()));
        services.AddScoped<ArchLucid.Core.Governance.PolicyPacks.IPolicyPackResolver>(static sp =>
            sp.GetRequiredService<CachingPolicyPackResolver>());
        services.AddScoped<ArchLucid.Decisioning.Governance.PolicyPacks.IPolicyPackResolver>(static sp =>
            new CorePolicyPackResolverAdapter(sp.GetRequiredService<CachingPolicyPackResolver>()));
        services.AddScoped<IPolicyPackResolverCacheInvalidator, PolicyPackResolverCacheInvalidator>();
        services.AddScoped<IPolicyPackManagementService, PolicyPackManagementService>();
        services.AddScoped<ArchLucid.Core.Governance.Resolution.IEffectiveGovernanceResolver, EffectiveGovernanceResolver>();
        services.AddScoped<IEffectiveGovernanceResolver, EffectiveGovernanceResolver>();
        services.AddScoped<EffectiveGovernanceLoader>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IEffectiveGovernanceLoader>(static sp =>
            new RequestScopedCachingEffectiveGovernanceLoader(sp.GetRequiredService<EffectiveGovernanceLoader>()));
        services.AddScoped<ArchLucid.Decisioning.Governance.PolicyPacks.IEffectiveGovernanceLoader>(static sp =>
            (ArchLucid.Decisioning.Governance.PolicyPacks.IEffectiveGovernanceLoader)sp.GetRequiredService<ArchLucid.Core.Persistence.Ports.IEffectiveGovernanceLoader>());
        services.AddScoped<IPolicyPacksAppService, PolicyPacksAppService>();
        services.AddScoped<IPolicyPackCatalogAdminService, PolicyPackCatalogAdminService>();
        services.AddScoped<IPlatformBundledPolicyPackAvailability, PlatformBundledPolicyPackAvailability>();
        services.AddScoped<PlatformBundledPolicyPackRegistryBootstrapper>();
        services.AddScoped<PolicyPackWorkspaceSelectionService>();
        services.AddScoped<IPolicyPackWorkflowFacade, PolicyPackWorkflowFacade>();
        services.AddScoped<IPolicyPackMarkdownExplainService, PolicyPackMarkdownExplainService>();
    }
}
