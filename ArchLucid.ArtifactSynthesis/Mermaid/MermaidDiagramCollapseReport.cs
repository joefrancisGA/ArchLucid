namespace ArchLucid.ArtifactSynthesis.Mermaid;

public sealed class MermaidDiagramCollapseEntry
{
    public string Kind
    {
        get;
        init;
    } = string.Empty;

    public Guid? CloudResourceId
    {
        get;
        init;
    }

    public string? NodeId
    {
        get;
        init;
    }

    public string Reason
    {
        get;
        init;
    } = string.Empty;
}

public sealed class MermaidDiagramCollapseReport
{
    public IReadOnlyList<MermaidDiagramCollapseEntry> Entries
    {
        get;
        init;
    } = [];
}
