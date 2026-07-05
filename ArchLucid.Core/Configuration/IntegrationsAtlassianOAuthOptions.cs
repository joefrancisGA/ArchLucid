namespace ArchLucid.Core.Configuration;

/// <summary>ArchLucid-owned Atlassian OAuth 2.0 (3LO) app settings for Jira/Confluence consent (TB-600).</summary>
public sealed class IntegrationsAtlassianOAuthOptions
{
    public const string SectionName = "Integrations:AtlassianOAuth";

    public string OAuthClientId { get; set; } = string.Empty;

    public string OAuthClientSecret { get; set; } = string.Empty;

    public string? OAuthClientIdKeyVaultSecretName { get; set; }

    public string? OAuthClientSecretKeyVaultSecretName { get; set; }

    public string Scopes { get; set; } = "read:jira-work write:jira-work offline_access";

    public string? DefaultRedirectUri { get; set; }
}
