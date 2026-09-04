using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Decisioning.Alerts;
using ArchLucid.Decisioning.Alerts.Composite;
using ArchLucid.Decisioning.Governance.ComplianceDrift;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Persistence.Agents;
using ArchLucid.Persistence.Alerts;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Repositories;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class InMemoryStorageProviderRegistrar
{
    private static void RegisterGovernanceFindingsPolicyAlertsGovernance(IServiceCollection services)
    {
        services.AddSingleton<IAlertRuleRepository, InMemoryAlertRuleRepository>();
        services.AddSingleton<IAlertRecordRepository, InMemoryAlertRecordRepository>();
        services.AddSingleton<IAlertRoutingSubscriptionRepository, InMemoryAlertRoutingSubscriptionRepository>();
        services.AddSingleton<IAlertDeliveryAttemptRepository, InMemoryAlertDeliveryAttemptRepository>();
        services.AddSingleton<ICompositeAlertRuleRepository, InMemoryCompositeAlertRuleRepository>();
        services.AddSingleton<IPolicyPackRepository, InMemoryPolicyPackRepository>();
        services.AddSingleton<IPolicyPackVersionRepository, InMemoryPolicyPackVersionRepository>();
        services.AddSingleton<IPolicyPackAssignmentRepository, InMemoryPolicyPackAssignmentRepository>();
        services.AddSingleton<IPolicyPackChangeLogRepository, InMemoryPolicyPackChangeLogRepository>();
        services.AddSingleton<IComplianceDriftFindingsTrendReader, InMemoryComplianceDriftFindingsTrendReader>();
        services.AddSingleton<IPolicyPackCatalogRepository, InMemoryPolicyPackCatalogRepository>();
        services.AddSingleton<IAgentModelCatalogRepository, InMemoryAgentModelCatalogRepository>();
        services.AddSingleton<IPlatformBundledPolicyPackRegistryRepository, InMemoryPlatformBundledPolicyPackRegistryRepository>();
    }
}
