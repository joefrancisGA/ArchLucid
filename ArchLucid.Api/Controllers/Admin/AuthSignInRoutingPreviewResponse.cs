namespace ArchLucid.Api.Controllers.Admin;

public sealed class AuthSignInRoutingPreviewResponse
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
}
