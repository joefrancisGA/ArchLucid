namespace ArchLucid.ArtifactSynthesis.Models;

/// <summary>Explains why an imported graph relationship was not painted (NR-11).</summary>
public sealed class DiagramDropGateRow
{
    public required string FromNodeId
    {
        get;
        init;
    }

    public required string ToNodeId
    {
        get;
        init;
    }

    public required string Reason
    {
        get;
        init;
    }
}
