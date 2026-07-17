namespace ArchLucid.Core.Identity;

/// <summary>Maps an email domain to a tenant sign-in policy for email OTP gating.</summary>
public sealed record TenantSignInEmailDomainRecord
{
    public Guid TenantId
    {
        get;
        init;
    }

    public string DisplayDomain
    {
        get;
        init;
    } = string.Empty;

    public string NormalizedDomain
    {
        get;
        init;
    } = string.Empty;

    public AuthDomainVerificationStatus VerificationStatus
    {
        get;
        init;
    } = AuthDomainVerificationStatus.Unverified;

    public AuthDomainEnforcementMode EnforcementMode
    {
        get;
        init;
    } = AuthDomainEnforcementMode.SsoOptional;

    public string? DnsVerificationToken
    {
        get;
        init;
    }

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

    public DateTimeOffset CreatedUtc
    {
        get;
        init;
    }

    public DateTimeOffset? VerificationPendingUtc
    {
        get;
        init;
    }

    public DateTimeOffset? VerifiedUtc
    {
        get;
        init;
    }

    public DateTimeOffset? VerificationFailedUtc
    {
        get;
        init;
    }

    public DateTimeOffset? RemovedUtc
    {
        get;
        init;
    }

    public DateTimeOffset? UpdatedUtc
    {
        get;
        init;
    }

    public DateTimeOffset? RoutingTestPassedUtc
    {
        get;
        init;
    }

    public DateTimeOffset? EnforcementEnabledUtc
    {
        get;
        init;
    }

    public bool IsEnforcementActive =>
        VerificationStatus == AuthDomainVerificationStatus.Verified
        && EnforcementEnabledUtc.HasValue
        && EnforcementMode != AuthDomainEnforcementMode.SsoOptional
        && RoutingTestPassedUtc.HasValue;
}
