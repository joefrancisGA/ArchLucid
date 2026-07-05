using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models.Auth;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class TrialLocalTokenResponse
{
    public string AccessToken
    {
        get;
        set;
    } = string.Empty;

    public string TokenType
    {
        get;
        set;
    } = "Bearer";

    public int ExpiresInSeconds
    {
        get;
        set;
    }
}
