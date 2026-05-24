namespace ArchLucid.Api.Models.Tenancy;

/// <summary>Whether the scoped workspace has persisted baseline inventory artifacts (Azure extractor ZIP rows).</summary>
public sealed class TenantWorkspaceBaselineArtifactsResponse
{
    public bool HasBaselineArtifacts
    {
        get;
        init;
    }

    public string? ExtractorScriptVersion
    {
        get;
        init;
    }
}
