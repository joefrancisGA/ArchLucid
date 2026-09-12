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

    /// <summary>
    ///     Original inventory graph node id used as the Dependency neighborhood seed.
    ///     Distinct from <see cref="NodeId" />, which is the sanitized mermaid identifier.
    /// </summary>
    public string? SeedNodeId
    {
        get;
        set;
    }

    public string? ArmResourceType
    {
        get;
        set;
    }

    public string? ArmResourceGroup
    {
        get;
        set;
    }
}
