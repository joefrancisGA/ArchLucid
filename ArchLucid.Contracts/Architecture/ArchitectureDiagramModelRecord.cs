namespace ArchLucid.Contracts.Architecture;

public sealed class ArchitectureDiagramModelRecord
{
    public List<ArchitectureDiagramNodeRecord> Nodes
    {
        get;
        set;
    } = [];

    public List<ArchitectureDiagramEdgeRecord> Edges
    {
        get;
        set;
    } = [];

    public List<string> TrustBoundaryLabels
    {
        get;
        set;
    } = [];
}
