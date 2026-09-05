namespace ArchLucid.Contracts.Architecture;

public sealed class ArchitectureDiagramNodeRecord
{
    public string Id
    {
        get;
        set;
    } = string.Empty;

    public string Label
    {
        get;
        set;
    } = string.Empty;

    public string Kind
    {
        get;
        set;
    } = ArchitectureDiagramNodeKinds.System;

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

    public bool Accepted
    {
        get;
        set;
    }
}
