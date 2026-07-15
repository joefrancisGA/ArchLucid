namespace ArchLucid.Core.Configuration;

using ArchLucid.Core.Integrations.Itsm;

/// <summary>First-party outbound ITSM issue/incident creation (see <c>Integrations:ItsmOutbound</c>).</summary>
public sealed class IntegrationsItsmOutboundOptions
{
    public const string SectionName = "Integrations:ItsmOutbound";

    /// <summary>
    ///     When <see langword="true" /> (hosted multi-tenant SaaS), deployment-wide Jira/ServiceNow credentials are ignored;
    ///     each tenant must register rows via <c>/v1/integrations/itsm/connections</c>.
    /// </summary>
    public bool RequireTenantScopedCredentials
    {
        get;
        set;
    }

    /// <summary>
    ///     When <see langword="true" /> (default), outbound create is enqueued on the background job queue
    ///     and returns <c>202 Accepted</c> with a job id. When <see langword="false" />, create runs synchronously in the HTTP request (local smoke).
    /// </summary>
    public bool DurableAsyncCreateEnabled
    {
        get;
        set;
    } = true;

    /// <summary>Worker-level retries after the outbound HTTP Polly pipeline is exhausted (0–10).</summary>
    public int AsyncCreateMaxRetries
    {
        get;
        set;
    } = 3;

    public JiraItsmOutboundOptions Jira { get; set; } = new();

    public ServiceNowItsmOutboundOptions ServiceNow { get; set; } = new();

    public AzureBoardsItsmOutboundOptions AzureBoards { get; set; } = new();
}

/// <summary>Jira Cloud REST create — basic auth (email + API token) or OAuth (TB-600).</summary>
public sealed class JiraItsmOutboundOptions
{
    /// <summary>E.g. <c>https://your-site.atlassian.net</c> (no trailing path).</summary>
    public string CloudBaseUrl { get; set; } = string.Empty;

    public ItsmConnectorAuthMode AuthMode { get; set; } = ItsmConnectorAuthMode.BasicApiToken;

    public string ServiceAccountEmail { get; set; } = string.Empty;

    /// <summary>API token for <see cref="ItsmConnectorAuthMode.BasicApiToken"/> (prefer Key Vault / secret manager in production).</summary>
    public string ApiToken { get; set; } = string.Empty;

    public string OAuthClientId { get; set; } = string.Empty;

    public string OAuthClientSecret { get; set; } = string.Empty;

    public string OAuthRefreshToken { get; set; } = string.Empty;

    /// <summary>Deployment-wide fallback when <c>TenantItsmOutboundSettings.JiraProjectKeyOverride</c> is empty.</summary>
    public string DefaultProjectKey { get; set; } = string.Empty;
}

/// <summary>ServiceNow Table API — instance URL + basic auth or OAuth client-credentials (TB-600).</summary>
public sealed class ServiceNowItsmOutboundOptions
{
    /// <summary>E.g. <c>https://your-instance.service-now.com</c> (no trailing path).</summary>
    public string InstanceBaseUrl { get; set; } = string.Empty;

    public ItsmConnectorAuthMode AuthMode { get; set; } = ItsmConnectorAuthMode.BasicApiToken;

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string OAuthClientId { get; set; } = string.Empty;

    public string OAuthClientSecret { get; set; } = string.Empty;
}

/// <summary>Azure DevOps Boards work-item create — organization URL + PAT (empty basic-auth username).</summary>
public sealed class AzureBoardsItsmOutboundOptions
{
    /// <summary>E.g. <c>https://dev.azure.com/your-organization</c> (no trailing path).</summary>
    public string OrganizationBaseUrl { get; set; } = string.Empty;

    /// <summary>PAT for deployment-wide fallback when tenant connector rows are absent.</summary>
    public string PersonalAccessToken { get; set; } = string.Empty;
}
