namespace ArchLucid.Core.Identity;

/// <summary>Maps an email domain to a tenant sign-in policy for email OTP gating.</summary>
public sealed class TenantSignInEmailDomainRecord
{
    public Guid TenantId
    {
        get;
        init;
    }

    public string NormalizedDomain
    {
        get;
        init;
    } = string.Empty;

    public bool RequireEnterpriseSso
    {
        get;
        init;
    }

    public bool AllowEmailOtpRecovery
    {
        get;
        init;
    }
}
