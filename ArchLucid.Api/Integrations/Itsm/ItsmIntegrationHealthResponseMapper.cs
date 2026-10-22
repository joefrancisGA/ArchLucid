using ArchLucid.Api.Models.Integrations;
using ArchLucid.Application.Integrations.Itsm.Outbound;

namespace ArchLucid.Api.Integrations.Itsm;

public static class ItsmIntegrationHealthResponseMapper
{
    public static ItsmIntegrationHealthResponse MapReport(
        ItsmOutboundIntegrationHealthReport report,
        bool nativeEnabled)
    {
        ArgumentNullException.ThrowIfNull(report);

        return new ItsmIntegrationHealthResponse
        {
            Status = report.Status,
            NativeEnabled = nativeEnabled,
            Jira = MapProbe(report.Jira),
            ServiceNow = MapProbe(report.ServiceNow),
        };
    }

    private static ItsmIntegrationHealthProbeVm MapProbe(ItsmOutboundIntegrationProviderProbe probe)
    {
        return new ItsmIntegrationHealthProbeVm
        {
            LocallyConfigured = probe.LocallyConfigured,
            Reachable = probe.Reachable,
            Summary = probe.Summary,
        };
    }
}
