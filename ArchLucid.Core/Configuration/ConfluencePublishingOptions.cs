namespace ArchLucid.Core.Configuration;

/// <summary>Confluence Cloud publishing for operator-authored run summaries (see <c>Integrations:ConfluencePublishing</c>).</summary>
public sealed class ConfluencePublishingOptions
{
    public const string SectionName = "Integrations:ConfluencePublishing";

    /// <summary>Feature gate — when <see langword="false" />, admin publish returns a clear error and the HTTP client is unused.</summary>
    public bool Enabled { get; set; }

    /// <summary>Base URL, e.g. <c>https://your-site.atlassian.net</c> (no trailing path).</summary>
    public string CloudBaseUrl { get; set; } = string.Empty;

    /// <summary>Target space key for new pages.</summary>
    public string SpaceKey { get; set; } = string.Empty;

    /// <summary>Atlassian Cloud account email paired with <see cref="ApiToken"/>.</summary>
    public string ServiceAccountEmail { get; set; } = string.Empty;

    /// <summary>Atlassian API token (store in Key Vault / secret manager in production).</summary>
    public string ApiToken { get; set; } = string.Empty;
}
