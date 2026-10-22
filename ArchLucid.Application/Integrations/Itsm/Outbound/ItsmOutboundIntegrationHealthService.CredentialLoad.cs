using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Integrations;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

public sealed partial class ItsmOutboundIntegrationHealthService
{
    private async Task<(
        TenantItsmOutboundSettings? TenantRow,
        IntegrationsItsmOutboundOptions Outbound,
        ResolvedItsmOutboundCredentials? JiraCredentials,
        ResolvedItsmOutboundCredentials? SnowCredentials)> LoadScopeCredentialsAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        TenantItsmOutboundSettings? tenantRow =
            await _tenantItsmOutboundSettings.TryGetAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        IntegrationsItsmOutboundOptions outbound = _outboundOptions.CurrentValue;

        ResolvedItsmOutboundCredentials? jiraCredentials = await _credentialResolver
            .TryResolveOutboundAsync(scope.TenantId, TenantItsmConnectorProvider.Jira, cancellationToken)
            .ConfigureAwait(false);

        ResolvedItsmOutboundCredentials? snowCredentials = await _credentialResolver
            .TryResolveOutboundAsync(scope.TenantId, TenantItsmConnectorProvider.ServiceNow, cancellationToken)
            .ConfigureAwait(false);

        return (tenantRow, outbound, jiraCredentials, snowCredentials);
    }
}
