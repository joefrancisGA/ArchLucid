using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Integrations.Itsm;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

public sealed partial class ItsmOutboundIntegrationHealthService
{
    private async Task<ItsmOutboundIntegrationProviderProbe> BuildServiceNowProbeAsync(
        HttpClient http,
        Guid tenantId,
        ResolvedItsmOutboundCredentials? credentials,
        ItsmOutboundLocalReadiness local,
        CancellationToken ct)
    {
        if (!local.IsReady)
            return new ItsmOutboundIntegrationProviderProbe(false, null, local.Summary);

        if (credentials is null)
            return new ItsmOutboundIntegrationProviderProbe(false, null, local.Summary);

        Uri incidentProbeUri = BuildServiceNowIncidentProbeUri(credentials.InstanceBaseUrl);

        (bool ok, string detail) = await ProbeGetWithAuthorizationAsync(
                http,
                incidentProbeUri,
                tenantId,
                TenantItsmConnectorProvider.ServiceNow,
                credentials,
                "ServiceNow",
                ct)
            .ConfigureAwait(false);

        if (!ok && _logger.IsEnabled(LogLevel.Warning))
            _logger.LogWarning("ITSM health probe: ServiceNow unreachable ({Detail}).", LogSanitizer.Sanitize(detail));

        string summary = ok
            ? "ServiceNow Table API reachable (GET incident with sysparm_limit=1)."
            : detail;

        return new ItsmOutboundIntegrationProviderProbe(true, ok, summary);
    }

    private static Uri BuildServiceNowIncidentProbeUri(string instanceBaseUrl)
    {
        string trimmed = instanceBaseUrl.Trim().TrimEnd('/');
        Uri root = new($"{trimmed}/", UriKind.Absolute);

        return new Uri(root, "api/now/table/incident?sysparm_limit=1");
    }
}
