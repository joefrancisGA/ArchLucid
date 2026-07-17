namespace ArchLucid.Core.Identity;

/// <summary>External sign-in identity linked to a <see cref="PlatformUserRecord" />.</summary>
public sealed class AuthenticationIdentityRecord
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

    public DateTimeOffset CreatedUtc
    {
        get;
        init;
    }

    public DateTimeOffset? LastAuthenticatedUtc
    {
        get;
        init;
    }

    public DateTimeOffset? DisabledUtc
    {
        get;
        init;
    }

    public bool IsActive => DisabledUtc is null;
}
