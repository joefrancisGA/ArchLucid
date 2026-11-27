namespace ArchLucid.Core.Configuration;

/// <summary>Azure DevOps Boards work-item create — organization URL + PAT (empty basic-auth username).</summary>
public sealed class AzureBoardsItsmOutboundOptions
{
    /// <summary>E.g. <c>https://dev.azure.com/your-organization</c> (no trailing path).</summary>
    public string OrganizationBaseUrl { get; set; } = string.Empty;

    /// <summary>PAT for deployment-wide fallback when tenant connector rows are absent.</summary>
    public string PersonalAccessToken { get; set; } = string.Empty;
}
