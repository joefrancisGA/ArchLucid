namespace ArchLucid.Contracts.Architecture;

public sealed class InfrastructureDiagramComparisonCreateRequest
{
    public Guid SnapshotId
    {
        get;
        set;
    }

    public List<DiagramSourceReference> Sources
    {
        get;
        set;
    } = [];
}
