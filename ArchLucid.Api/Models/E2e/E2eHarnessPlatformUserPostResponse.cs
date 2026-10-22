namespace ArchLucid.Api.Models.E2e;

/// <summary>Response for <c>POST /v1/e2e/platform-users</c> (harness only).</summary>
[System.Diagnostics.CodeAnalysis.ExcludeFromCodeCoverage(Justification = "API response DTO; auto-properties only.")]
public sealed class E2eHarnessPlatformUserPostResponse
{
    public Guid PlatformUserId
    {
        get;
        init;
    }

    public string PreAuthAccessToken
    {
        get;
        init;
    } = string.Empty;
}
