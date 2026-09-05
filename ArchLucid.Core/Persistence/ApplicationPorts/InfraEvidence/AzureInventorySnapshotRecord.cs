using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventorySnapshotRecord
{
    public Guid SnapshotId
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

    public Guid PackageId
    {
        get;
        init;
    }

    public string? SubscriptionId
    {
        get;
        init;
    }

    public string? SubscriptionName
    {
        get;
        init;
    }

    public DateTime? CapturedUtc
    {
        get;
        init;
    }

    public AzureInventoryCaptureStatus CaptureStatus
    {
        get;
        init;
    }

    public string? CaptureVersion
    {
        get;
        init;
    }

    public int ResourceCount
    {
        get;
        init;
    }

    public int RelationshipCount
    {
        get;
        init;
    }

    public AzureInventoryCaptureMethod CaptureMethod
    {
        get;
        init;
    }

    public string? CollectorVersion
    {
        get;
        init;
    }

    public string? RequestedBy
    {
        get;
        init;
    }

    public int? DurationMs
    {
        get;
        init;
    }

    public decimal? CompletenessScore
    {
        get;
        init;
    }

    public int WarningCount
    {
        get;
        init;
    }

    public int ErrorCount
    {
        get;
        init;
    }

    public byte[]? ContentHashSha256
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public DateTime UpdatedUtc
    {
        get;
        init;
    }
}
