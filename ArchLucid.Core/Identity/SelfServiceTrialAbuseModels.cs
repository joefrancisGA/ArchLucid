namespace ArchLucid.Core.Identity;

public sealed class SelfServiceTrialAbuseEvaluationRequest
{
    public string NormalizedEmail
    {
        get;
        init;
    } = string.Empty;

    public string? InvitationToken
    {
        get;
        init;
    }

    public string? ClientIp
    {
        get;
        init;
    }

    public Guid? PlatformUserId
    {
        get;
        init;
    }
}

public sealed class SelfServiceTrialAbuseEvaluation
{
    public bool Allowed
    {
        get;
        init;
    }

    public string DenyReasonCode
    {
        get;
        init;
    } = string.Empty;

    public string CustomerMessage
    {
        get;
        init;
    } = string.Empty;

    public static SelfServiceTrialAbuseEvaluation Allow() =>
        new() { Allowed = true };

    public static SelfServiceTrialAbuseEvaluation Deny(string reasonCode, string customerMessage) =>
        new()
        {
            Allowed = false,
            DenyReasonCode = reasonCode,
            CustomerMessage = customerMessage
        };
}

public sealed class SelfServiceTrialEmailClaimInsert
{
    public string NormalizedEmail
    {
        get;
        init;
    } = string.Empty;

    public Guid? PlatformUserId
    {
        get;
        init;
    }

    public Guid? TenantId
    {
        get;
        init;
    }

    public string ClaimSource
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset ClaimedUtc
    {
        get;
        init;
    }
}

public sealed class SelfServiceTrialDomainClaimRecord
{
    public string NormalizedDomain
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset ClaimedUtc
    {
        get;
        init;
    }
}
