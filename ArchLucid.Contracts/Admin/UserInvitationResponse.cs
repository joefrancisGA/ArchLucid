namespace ArchLucid.Contracts.Admin;

public sealed class UserInvitationResponse
{
    public Guid Id
    {
        get;
        set;
    }

    public string Email
    {
        get;
        set;
    } = string.Empty;

    public string AppRole
    {
        get;
        set;
    } = string.Empty;

    public string Status
    {
        get;
        set;
    } = string.Empty;

    public string TenantName
    {
        get;
        set;
    } = string.Empty;

    public Guid WorkspaceId
    {
        get;
        set;
    }

    public string InvitedByActorId
    {
        get;
        set;
    } = string.Empty;

    public string? Message
    {
        get;
        set;
    }

    public DateTimeOffset CreatedUtc
    {
        get;
        set;
    }

    public DateTimeOffset ExpiresUtc
    {
        get;
        set;
    }
}
