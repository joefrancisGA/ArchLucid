using ArchLucid.Core.Integrations.Itsm;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Builds operator-facing browse URLs for linked Jira issues and ServiceNow incidents.</summary>
public sealed class ItsmExternalTicketUrlBuilder(IItsmTenantConnectorCredentialResolver credentialResolver)
{
    private readonly IItsmTenantConnectorCredentialResolver _credentialResolver =
        credentialResolver ?? throw new ArgumentNullException(nameof(credentialResolver));

    public async Task<string?> TryBuildBrowseUrlAsync(
        Guid tenantId,
        string provider,
        string externalKey,
        string? externalSysId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(provider) || string.IsNullOrWhiteSpace(externalKey))
            return null;

        if (provider.Equals("Jira", StringComparison.OrdinalIgnoreCase))
        {
            string? baseUrl = await ResolveBaseUrlAsync(tenantId, TenantItsmConnectorProvider.Jira, cancellationToken)
                .ConfigureAwait(false);

            if (baseUrl is null)
                return null;

            return $"{baseUrl}/browse/{Uri.EscapeDataString(externalKey.Trim())}";
        }

        if (provider.Equals("ServiceNow", StringComparison.OrdinalIgnoreCase))
        {
            string? baseUrl = await ResolveBaseUrlAsync(tenantId, TenantItsmConnectorProvider.ServiceNow, cancellationToken)
                .ConfigureAwait(false);

            if (baseUrl is null || string.IsNullOrWhiteSpace(externalSysId))
                return null;

            return $"{baseUrl}/nav_to.do?uri=incident.do?sys_id={Uri.EscapeDataString(externalSysId.Trim())}";
        }

        return null;
    }

    private Task<string?> ResolveBaseUrlAsync(
        Guid tenantId,
        TenantItsmConnectorProvider provider,
        CancellationToken cancellationToken) =>
        _credentialResolver.TryResolveInstanceBaseUrlAsync(tenantId, provider, cancellationToken);
}
