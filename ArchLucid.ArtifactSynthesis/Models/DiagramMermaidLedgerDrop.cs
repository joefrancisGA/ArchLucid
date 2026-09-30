namespace ArchLucid.ArtifactSynthesis.Models;

public sealed class DiagramMermaidLedgerDrop
{
    public string Reason
    {
        get;
        set;
    } = null!;

    public string FromNodeId
    {
        get;
        set;
    } = null!;

    public string? ToNodeId
    {
        get;
        set;
    }
}
