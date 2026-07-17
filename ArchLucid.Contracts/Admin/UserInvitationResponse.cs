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

    /// <summary>Raw token — returned only when an invitation is first created.</summary>
    public string? InvitationToken
    {
        get;
        set;
    }

    /// <summary>Relative accept path for operator UI (e.g. /auth/invite?token=...).</summary>
    public string? AcceptPath
    {
        get;
        set;
    }

    /// <summary>Absolute accept URL when Email:OperatorBaseUrl is configured.</summary>
    public string? AcceptUrl
    {
        get;
        set;
    }
}
