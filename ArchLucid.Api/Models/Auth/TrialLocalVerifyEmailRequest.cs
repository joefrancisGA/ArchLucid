namespace ArchLucid.Api.Models.Auth;

public sealed class TrialLocalVerifyEmailRequest
{
    public string? Email
    {
        get;
        set;
    }

    public string? Token
    {
        get;
        set;
    }
}
