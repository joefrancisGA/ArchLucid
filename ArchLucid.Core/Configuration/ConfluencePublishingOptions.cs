namespace ArchLucid.Core.Configuration;

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

    /// <summary>Atlassian Cloud account email paired with <see cref="ApiToken"/>.</summary>
    public string ServiceAccountEmail { get; set; } = string.Empty;

    /// <summary>Atlassian API token (store in Key Vault / secret manager in production).</summary>
    public string ApiToken { get; set; } = string.Empty;
}
