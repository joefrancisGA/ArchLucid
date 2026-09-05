namespace ArchLucid.Contracts.Architecture;

public sealed class DiagramInfrastructureReconciliationResult
{
    public Guid RunId
    {
        get;
        set;
    }

    public Guid SnapshotId
    {
        get;
        set;
    }

    public List<DiagramInfrastructureCorrespondenceRow> Rows
    {
        get;
        set;
    } = [];

    public int DiagramNodeCount
    {
        get;
        set;
    }

    public int InventoryResourceCount
    {
        get;
        set;
    }
}
