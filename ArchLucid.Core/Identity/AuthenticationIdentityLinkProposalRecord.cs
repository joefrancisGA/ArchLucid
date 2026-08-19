namespace ArchLucid.Core.Identity;

/// <summary>Pending external identity attachment awaiting explicit user confirmation.</summary>
public sealed record AuthenticationIdentityLinkProposalRecord
{
    public Guid Id
    {
        get;
        init;
    }

    public Guid UserId
    {
        get;
        init;
    }

    public AuthenticationProviderType ProviderType
    {
        get;
        init;
    }

    public string NormalizedIssuer
    {
        get;
        init;
    } = string.Empty;

    public string Subject
    {
        get;
        init;
    } = string.Empty;

    public Guid? TenantId
    {
        get;
        init;
    }

    public Guid? TenantIdentityProviderId
    {
        get;
        init;
    }

    public string? NormalizedEmail
    {
        get;
        init;
    }

    public string? DisplayEmail
    {
        get;
        init;
    }

    public bool EmailVerified
    {
        get;
        init;
    }

    public bool RequiresExplicitConfirmation
    {
        get;
        init;
    }

    public AuthenticationIdentityLinkProposalStatus Status
    {
        get;
        init;
    } = AuthenticationIdentityLinkProposalStatus.PendingConfirmation;

    public DateTimeOffset CreatedUtc
    {
        get;
        init;
    }

    public DateTimeOffset ExpiresUtc
    {
        get;
        init;
    }

    public DateTimeOffset? ConfirmedUtc
    {
        get;
        init;
    }

    public DateTimeOffset? CancelledUtc
    {
        get;
        init;
    }

    public ExternalIdentityKey ToExternalKey() =>
        new()
        {
            ProviderType = ProviderType,
            NormalizedIssuer = NormalizedIssuer,
            Subject = Subject,
            TenantId = TenantId,
            TenantIdentityProviderId = TenantIdentityProviderId
        };
}
