using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryDriftApprovalRecord
{
    public Guid ApprovalId
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

    public Guid ProjectId
    {
        get;
        init;
    }

    public Guid DiffId
    {
        get;
        init;
    }

    public Guid? ChangeId
    {
        get;
        init;
    }

    public string Approver
    {
        get;
        init;
    } = string.Empty;

    public string Reason
    {
        get;
        init;
    } = string.Empty;

    public string? TicketReference
    {
        get;
        init;
    }

    public DateTime ExpirationUtc
    {
        get;
        init;
    }

    public AzureInventoryDriftApprovalStatus Status
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }
}
