namespace ArchLucid.Provenance;

public class ProvenanceNode
{
    public Guid Id
    {
        get;
        set;
    }

    public ProvenanceNodeType Type
    {
        get;
        set;
    }

    /// <summary>Domain reference, e.g. FindingId, DecisionId, NodeId, RuleId.</summary>
    public string ReferenceId
    {
        get;
        set;
    } = null!;

    public string Name
    {
        get;
        set;
    } = null!;

    /// <summary>Optional FK to <c>dbo.AgentExecutionTraces.TraceId</c> when this node maps to an agent task output.</summary>
    public string? AgentExecutionTraceId
    {
        get;
        set;
    }

    public Dictionary<string, string> Metadata
    {
        get;
        set;
    } = new();
}
