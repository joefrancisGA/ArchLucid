namespace ArchLucid.ArtifactSynthesis.Models;

public class DiagramNode
{
    public string NodeId
    {
        get;
        set;
    } = null!;

    public string Label
    {
        get;
        set;
    } = null!;

    public string NodeType
    {
        get;
        set;
    } = null!;

    public string? SubgraphId
    {
        get;
        set;
    }

    public int OrderKey
    {
        get;
        set;
    }

    public Guid? CloudResourceId
    {
        get;
        set;
    }
}
