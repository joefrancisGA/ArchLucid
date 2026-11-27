namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>Bounds for outbound ITSM connectivity probes (<see cref="ItsmOutboundIntegrationHealthService" />).</summary>
public static class ItsmOutboundIntegrationHealthLimits
{
    /// <summary><c>IHttpClientFactory</c> name for Jira connectivity probes.</summary>
    public const string JiraHttpClientName = "ItsmOutboundIntegrationHealth.Jira";

    /// <summary><c>IHttpClientFactory</c> name for ServiceNow connectivity probes.</summary>
    public const string ServiceNowHttpClientName = "ItsmOutboundIntegrationHealth.ServiceNow";

    /// <summary>Aligned with operator lint-style connectivity checks; avoids hanging dashboards on poison endpoints.</summary>
    public const int NetworkTimeoutSeconds = 12;
}
