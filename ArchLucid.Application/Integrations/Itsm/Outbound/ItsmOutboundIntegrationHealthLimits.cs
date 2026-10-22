namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>Bounds for outbound ITSM connectivity probes (<see cref="ItsmOutboundIntegrationHealthService" />).</summary>
public static class ItsmOutboundIntegrationHealthLimits
{
    /// <summary><c>IHttpClientFactory</c> logical client name for pooled outbound probes.</summary>
    public const string HttpClientName = "ItsmOutboundIntegrationHealth";

    /// <summary>Aligned with operator lint-style connectivity checks; avoids hanging dashboards on poison endpoints.</summary>
    public const int NetworkTimeoutSeconds = 12;
}
