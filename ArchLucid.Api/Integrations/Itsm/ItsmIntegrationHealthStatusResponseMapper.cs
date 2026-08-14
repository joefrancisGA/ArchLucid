using ArchLucid.Contracts.Integrations;

namespace ArchLucid.Api.Integrations.Itsm;

public static class ItsmIntegrationHealthStatusResponseMapper
{
    public static ItsmIntegrationHealthStatusResponse Map(ItsmIntegrationHealthResponse health)
    {
        return new ItsmIntegrationHealthStatusResponse
        {
            Status = health.Status,
            NativeEnabled = health.NativeEnabled,
            Jira = MapProbe(health.Jira),
            ServiceNow = MapProbe(health.ServiceNow)
        };
    }

    private static ItsmIntegrationHealthProviderProbeResponse MapProbe(ItsmIntegrationHealthProbeVm probe)
    {
        return new ItsmIntegrationHealthProviderProbeResponse
        {
            LocallyConfigured = probe.LocallyConfigured,
            Reachable = probe.Reachable,
            Summary = probe.Summary
        };
    }
}
