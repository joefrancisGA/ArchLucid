namespace ArchLucid.Api.Models.Auth;

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
