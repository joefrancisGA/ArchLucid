namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryDiffSummaryRecord
{
    public Guid DiffId
    {
        get;
        init;
    }

    public Guid SnapshotAId
    {
        get;
        init;
    }

    public Guid SnapshotBId
    {
        get;
        init;
    }

    public string? SubscriptionId
    {
        get;
        init;
    }

    public int TotalChanges
    {
        get;
        init;
    }

    public int ResourceAddedCount
    {
        get;
        init;
    }

    public int ResourceRemovedCount
    {
        get;
        init;
    }

    public int ResourceModifiedCount
    {
        get;
        init;
    }

    public int NetworkExposureChangeCount
    {
        get;
        init;
    }

    public int PermissionChangeCount
    {
        get;
        init;
    }

    public int LoggingRegressionCount
    {
        get;
        init;
    }

    public int NewPrivateEndpointCount
    {
        get;
        init;
    }

    public int RelationshipRemovedCount
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
