namespace ArchLucid.Core.Configuration;

using ArchLucid.Core.Integrations.Itsm;

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
