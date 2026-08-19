namespace ArchLucid.Core.Identity;

public sealed class PlatformUserInsert
{
    public Guid Id
    {
        get;
        init;
    }

    public string? PrimaryEmail
    {
        get;
        init;
    }

    public string? NormalizedPrimaryEmail
    {
        get;
        init;
    }

    public string? DisplayName
    {
        get;
        init;
    }

    public PlatformUserStatus Status
    {
        get;
        init;
    } = PlatformUserStatus.Active;

    public Guid AuthVersion
    {
        get;
        init;
    }
}

public sealed class AuthenticationIdentityInsert
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
}

public sealed class WorkspaceMembershipInsert
{
    public Guid UserId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid WorkspaceId
    {
        get;
        init;
    }

    public string Role
    {
        get;
        init;
    } = string.Empty;

    public WorkspaceMembershipStatus Status
    {
        get;
        init;
    } = WorkspaceMembershipStatus.Active;
}
