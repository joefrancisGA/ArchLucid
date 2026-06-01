using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Builds operator-facing browse URLs for linked Jira issues and ServiceNow incidents.</summary>
public sealed class ItsmExternalTicketUrlBuilder(IOptionsMonitor<IntegrationsItsmOutboundOptions> outboundOptions)
{
    private readonly IOptionsMonitor<IntegrationsItsmOutboundOptions> _outboundOptions =
        outboundOptions ?? throw new ArgumentNullException(nameof(outboundOptions));

    public string? TryBuildBrowseUrl(string provider, string externalKey, string? externalSysId)
    {
        if (string.IsNullOrWhiteSpace(provider) || string.IsNullOrWhiteSpace(externalKey))
            return null;

        IntegrationsItsmOutboundOptions outbound = _outboundOptions.CurrentValue;

        if (provider.Equals("Jira", StringComparison.OrdinalIgnoreCase))
        {
            string? baseUrl = NormalizeBaseUrl(outbound.Jira.CloudBaseUrl);

            if (baseUrl is null)
                return null;

            return $"{baseUrl}/browse/{Uri.EscapeDataString(externalKey.Trim())}";
        }

        if (provider.Equals("ServiceNow", StringComparison.OrdinalIgnoreCase))
        {
            string? baseUrl = NormalizeBaseUrl(outbound.ServiceNow.InstanceBaseUrl);

            if (baseUrl is null || string.IsNullOrWhiteSpace(externalSysId))
                return null;

            return $"{baseUrl}/nav_to.do?uri=incident.do?sys_id={Uri.EscapeDataString(externalSysId.Trim())}";
        }

        return null;
    }

    private static string? NormalizeBaseUrl(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        return raw.Trim().TrimEnd('/');
    }
}
