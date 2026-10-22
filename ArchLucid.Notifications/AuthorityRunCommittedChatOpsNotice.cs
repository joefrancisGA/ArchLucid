namespace ArchLucid.Notifications;

/// <summary>Telemetry-safe summary passed to ChatOps integrations after SQL commit of an authority run.</summary>
public sealed class AuthorityRunCommittedChatOpsNotice
{
    public required Guid TenantId
    {
        get;
        init;
    }

    public required Guid WorkspaceId
    {
        get;
        init;
    }

    public required Guid ProjectId
    {
        get;
        init;
    }

    public required Guid RunId
    {
        get;
        init;
    }

    public int FindingCount
    {
        get;
        init;
    }

    public string? Description
    {
        get;
        init;
    }
}
