namespace ArchLucid.Core.Identity;

/// <summary>Tenant/workspace role membership for a platform user.</summary>
public sealed class WorkspaceMembershipRecord
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
    }

    public DateTimeOffset CreatedUtc
    {
        get;
        init;
    }

    public DateTimeOffset UpdatedUtc
    {
        get;
        init;
    }
}
