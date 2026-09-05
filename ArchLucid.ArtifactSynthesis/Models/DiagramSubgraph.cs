namespace ArchLucid.ArtifactSynthesis.Models;

public class DiagramSubgraph
{
    public string SubgraphId
    {
        get;
        set;
    } = null!;

    public string Label
    {
        get;
        set;
    } = null!;

    public string? ParentSubgraphId
    {
        get;
        set;
    }

    public int OrderKey
    {
        get;
        set;
    }
}
