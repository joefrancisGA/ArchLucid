using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Architecture;

public sealed class DiagramInfrastructureReconciliationResult
{
    public Guid? ComparisonId
    {
        get;
        set;
    }

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

    private List<DiagramInfrastructureCorrespondenceRow> rows = [];

    public List<DiagramInfrastructureCorrespondenceRow> Rows
    {
        get => rows;
        set => rows = ContractCollectionDefaults.Coalesce(value);
    }

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

    private List<DiagramInfrastructureEdgeGapRow> edgeGaps = [];

    public List<DiagramInfrastructureEdgeGapRow> EdgeGaps
    {
        get => edgeGaps;
        set => edgeGaps = ContractCollectionDefaults.Coalesce(value);
    }
}
