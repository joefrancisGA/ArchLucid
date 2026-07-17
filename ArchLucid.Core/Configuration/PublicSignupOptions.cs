namespace ArchLucid.Core.Configuration;

/// <summary>Controls whether anonymous self-service registration and workspace creation are allowed.</summary>
public enum PublicSignupMode
{
    InviteOnly = 0,
    PublicSelfService = 1
}

/// <summary>Posture for public signup surfaces (<c>POST /v1/register</c>, post-auth workspace create).</summary>
public sealed class PublicSignupOptions
{
    public const string SectionPath = "Auth:PublicSignup";

    public PublicSignupMode Mode
    {
        get;
        set;
    } = PublicSignupMode.InviteOnly;

    public bool IsPublicSelfServiceEnabled() => Mode == PublicSignupMode.PublicSelfService;

    public bool IsInviteOnly() => Mode == PublicSignupMode.InviteOnly;
}
