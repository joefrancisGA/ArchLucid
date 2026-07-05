namespace ArchLucid.Core.Configuration;

using ArchLucid.Core.Integrations.Itsm;

/// <summary>Confluence Cloud publishing for operator-authored run summaries (see <c>Integrations:ConfluencePublishing</c>).</summary>
public sealed class ConfluencePublishingOptions
{
    public const string SectionName = "Integrations:ConfluencePublishing";

    /// <summary>Feature gate — when <see langword="false" />, admin publish returns a clear error and the HTTP client is unused.</summary>
    public bool Enabled { get; set; }

    /// <summary>Base URL, e.g. <c>https://your-site.atlassian.net</c> (no trailing path).</summary>
    public string CloudBaseUrl { get; set; } = string.Empty;

    /// <summary>Default Confluence space key when <see cref="ProjectSpaceKeys"/> has no entry for the architecture project.</summary>
    public string SpaceKey { get; set; } = string.Empty;

    /// <summary>
    ///     Optional map of architecture <see cref="ArchLucid.Core.Scoping.ScopeContext.ProjectId"/> (GUID string in any format)
    ///     → Confluence space key. Evaluated before <see cref="SpaceKey"/>.
    /// </summary>
    public Dictionary<string, string>? ProjectSpaceKeys { get; set; }

    /// <summary>Outbound auth mode for Confluence REST calls (TB-600). Defaults to basic email + API token.</summary>
    public ItsmConnectorAuthMode AuthMode { get; set; } = ItsmConnectorAuthMode.BasicApiToken;

    /// <summary>Atlassian Cloud account email paired with <see cref="ApiToken"/> for <see cref="ItsmConnectorAuthMode.BasicApiToken"/>.</summary>
    public string ServiceAccountEmail { get; set; } = string.Empty;

    /// <summary>Atlassian API token for <see cref="ItsmConnectorAuthMode.BasicApiToken"/> (store in Key Vault / secret manager in production).</summary>
    public string ApiToken { get; set; } = string.Empty;

    /// <summary>OAuth client id for <see cref="ItsmConnectorAuthMode.OAuth2RefreshToken"/> (prefer Key Vault in production).</summary>
    public string OAuthClientId { get; set; } = string.Empty;

    /// <summary>OAuth client secret for refresh-token grant (prefer Key Vault in production).</summary>
    public string OAuthClientSecret { get; set; } = string.Empty;

    /// <summary>Long-lived OAuth refresh token obtained from the Atlassian consent flow.</summary>
    public string OAuthRefreshToken { get; set; } = string.Empty;
}
