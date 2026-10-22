using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Api.Controllers.InfraEvidence;

public sealed class DesignateAzureInventoryBaselineRequest
{
    public Guid SnapshotId
    {
        get;
        init;
    }

    public AzureInventoryBaselineKind BaselineKind
    {
        get;
        init;
    }

    public string DesignatedBy
    {
        get;
        init;
    } = string.Empty;

    public string? Notes
    {
        get;
        init;
    }
}

public sealed class CreateAzureInventoryDriftApprovalRequest
{
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
}

public sealed class BuildAzureInventoryDiffNarrativeRequest
{
    public AzureInventoryDiffNarrativeKind NarrativeKind
    {
        get;
        init;
    }

    public bool UseSimulator
    {
        get;
        init;
    }
}
