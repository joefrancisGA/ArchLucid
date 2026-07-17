namespace ArchLucid.Api.Models.Auth;

public sealed class AuthSignInRoutingEvaluateBody
{
    public string? Email
    {
        get;
        init;
    }

    public string? InvitationToken
    {
        get;
        init;
    }

    public string? ReturnPath
    {
        get;
        init;
    }
}

public sealed class AuthSignInRoutingResponse
{
    public bool AllowEmailCode
    {
        get;
        init;
    }

    public bool SsoRequired
    {
        get;
        init;
    }

    public string? Message
    {
        get;
        init;
    }

    public string? ReturnPath
    {
        get;
        init;
    }
}
