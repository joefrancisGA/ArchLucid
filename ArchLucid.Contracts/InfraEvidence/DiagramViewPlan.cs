namespace ArchLucid.Contracts.InfraEvidence;

public sealed class DiagramViewPlan
{
    public string MermaidMode
    {
        get;
        set;
    } = string.Empty;

    public string? ResourceGroupName
    {
        get;
        set;
    }

    public string? SeedNodeId
    {
        get;
        set;
    }

    public Guid? SnapshotId
    {
        get;
        set;
    }

    public Guid? CloudResourceId
    {
        get;
        set;
    }

    public string? FitTargetNodeId
    {
        get;
        set;
    }

    public string HonestyLabel
    {
        get;
        set;
    } = "Proposed view — existing diagram modes only";
}
