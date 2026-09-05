namespace ArchLucid.Contracts.InfraEvidence;

public sealed class CloudResourceInventoryChangeSummary
{
    public Guid ChangeId
    {
        get;
        set;
    }

    public Guid DiffId
    {
        get;
        set;
    }

    public Guid SnapshotAId
    {
        get;
        set;
    }

    public Guid SnapshotBId
    {
        get;
        set;
    }

    public string ChangeType
    {
        get;
        set;
    } = string.Empty;

    public string? Property
    {
        get;
        set;
    }

    public string? OldValue
    {
        get;
        set;
    }

    public string? NewValue
    {
        get;
        set;
    }

    public string? RiskClassification
    {
        get;
        set;
    }
}
