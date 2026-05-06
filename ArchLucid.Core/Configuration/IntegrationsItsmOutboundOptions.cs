namespace ArchLucid.Core.Configuration;

/// <summary>First-party outbound ITSM issue/incident creation (see <c>Integrations:ItsmOutbound</c>).</summary>
public sealed class IntegrationsItsmOutboundOptions
{
    public const string SectionName = "Integrations:ItsmOutbound";

    public JiraItsmOutboundOptions Jira { get; set; } = new();

    public ServiceNowItsmOutboundOptions ServiceNow { get; set; } = new();
}

/// <summary>Jira Cloud REST create — basic auth (email + API token).</summary>
public sealed class JiraItsmOutboundOptions
{
    /// <summary>E.g. <c>https://your-site.atlassian.net</c> (no trailing path).</summary>
    public string CloudBaseUrl { get; set; } = string.Empty;

    public string ServiceAccountEmail { get; set; } = string.Empty;

    /// <summary>API token (prefer Key Vault / secret manager in production).</summary>
    public string ApiToken { get; set; } = string.Empty;

    /// <summary>Deployment-wide fallback when <c>TenantItsmOutboundSettings.JiraProjectKeyOverride</c> is empty.</summary>
    public string DefaultProjectKey { get; set; } = string.Empty;
}

/// <summary>ServiceNow Table API — instance URL + basic auth.</summary>
public sealed class ServiceNowItsmOutboundOptions
{
    /// <summary>E.g. <c>https://your-instance.service-now.com</c> (no trailing path).</summary>
    public string InstanceBaseUrl { get; set; } = string.Empty;

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}
