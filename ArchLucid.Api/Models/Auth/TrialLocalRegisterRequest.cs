namespace ArchLucid.Api.Models.Auth;

public sealed class TrialLocalRegisterRequest
{
    public string? Email
    {
        get;
        set;
    }

    public string? Password
    {
        get;
        set;
    }
}
