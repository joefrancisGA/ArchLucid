namespace ArchLucid.ArtifactSynthesis.Models;

public class DiagramEdge
{
    public string FromNodeId
    {
        get;
        set;
    } = null!;

    public string ToNodeId
    {
        get;
        set;
    } = null!;

    public string Label
    {
        get;
        set;
    } = null!;

    /// <summary>True when the edge exists only to steer dagre layout (rendered as Mermaid <c>~~~</c>).</summary>
    public bool IsLayoutOnly
    {
        get;
        set;
    }
}
