namespace ArchLucid.Core.Admin;

public sealed class UserInvitationRecord
{
    public Guid Id
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

    public string Email
    {
        get;
        init;
    } = string.Empty;

    public string AppRole
    {
        get;
        init;
    } = string.Empty;

    public string InvitedByActorId
    {
        get;
        init;
    } = string.Empty;

    public string? Message
    {
        get;
        init;
    }

    public UserInvitationStatus Status
    {
        get;
        init;
    }

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

    public DateTimeOffset? RevokedUtc
    {
        get;
        init;
    }

    public DateTimeOffset? AcceptedUtc
    {
        get;
        init;
    }
}
