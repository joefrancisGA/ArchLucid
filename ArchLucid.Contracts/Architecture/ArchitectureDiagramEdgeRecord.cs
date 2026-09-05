namespace ArchLucid.Contracts.Architecture;

public sealed class ArchitectureDiagramEdgeRecord
{
    public string Id
    {
        get;
        set;
    } = string.Empty;

    public string SourceId
    {
        get;
        set;
    } = string.Empty;

    public string TargetId
    {
        get;
        set;
    } = string.Empty;

    public string Label
    {
        get;
        set;
    } = string.Empty;

    public string Provenance
    {
        get;
        set;
    } = ArchitectureDiagramProvenanceKinds.Inferred;

    public bool Removed
    {
        get;
        set;
    }
}
