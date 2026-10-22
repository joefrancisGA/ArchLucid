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

    public string? ProvenanceKind
    {
        get;
        set;
    }

    public string? InferenceSource
    {
        get;
        set;
    }

    public string? DeclaredConnectionId
    {
        get;
        set;
    }

    /// <summary>True when an applicable NSG denies the connector flow (NR-08).</summary>
    public bool IsDataFlowNsgBlocked
    {
        get;
        set;
    }

    /// <summary>Effective NSG protocol/port labels shown on the connector (NR-08).</summary>
    public List<string> DataFlowNsgAnnotationLabels
    {
        get;
        set;
    } = [];

    /// <summary>Supporting NSG rule identity available on demand (NR-08).</summary>
    public List<string> DataFlowNsgSupportingRuleDetails
    {
        get;
        set;
    } = [];
}
