namespace ArchLucid.Provenance;

/// <summary>UI-ready graph (e.g. React Flow, Cytoscape): string ids and labels.</summary>
public class GraphViewModel
{
    public List<GraphNodeVm> Nodes
    {
        get;
        set;
    } = [];

    public List<GraphEdgeVm> Edges
    {
        get;
        set;
    } = [];

    /// <summary>Serialized for JSON clients (provenance and architecture graph endpoints).</summary>
    public int NodeCount => Nodes.Count;

    /// <summary>Serialized edge count for empty-state and layout hints in operator UIs.</summary>
    public int EdgeCount => Edges.Count;

    /// <summary>True when there are no nodes (explicit empty graph).</summary>
    public bool IsEmpty => Nodes.Count == 0;
}

public class GraphNodeVm
{
    public string Id
    {
        get;
        set;
    } = null!;

    public string Label
    {
        get;
        set;
    } = null!;

    public string Type
    {
        get;
        set;
    } = null!;

    /// <summary>Optional key/value pairs for UI detail panel (provenance metadata, graph properties).</summary>
    public Dictionary<string, string>? Metadata
    {
        get;
        set;
    }

    /// <summary>Optional agent execution trace id for provenance ↔ LLM forensics deep links (TB-036).</summary>
    public string? AgentExecutionTraceId
    {
        get;
        set;
    }

    /// <summary>Optional agent/heuristic narration for operator graph explainability.</summary>
    public string? ReasoningTrace
    {
        get;
        set;
    }
}

public class GraphEdgeVm
{
    /// <summary>Stable snapshot edge id when present.</summary>
    public string? Id
    {
        get;
        set;
    }

    public string Source
    {
        get;
        set;
    } = null!;

    public string Target
    {
        get;
        set;
    } = null!;

    public string Type
    {
        get;
        set;
    } = null!;

    /// <summary>Optional traversal label from graph edge payloads.</summary>
    public string? Label
    {
        get;
        set;
    }

    /// <summary>Rule tag when inferred (stored as inferenceSource on persisted edges).</summary>
    public string? InferenceSource
    {
        get;
        set;
    }

    /// <summary>Deterministic heuristic or propagated agent narration for this edge.</summary>
    public string? ReasoningTrace
    {
        get;
        set;
    }
}

/// <summary>
///     Paginated architecture graph (same node/edge VM shapes as <see cref="GraphViewModel" />).
/// </summary>
public sealed class GraphNodesPageResponse
{
    public int Page
    {
        get;
        set;
    }

    public int PageSize
    {
        get;
        set;
    }

    public int TotalNodes
    {
        get;
        set;
    }

    public bool HasMore
    {
        get;
        set;
    }

    public List<GraphNodeVm> Nodes
    {
        get;
        set;
    } = [];

    public List<GraphEdgeVm> Edges
    {
        get;
        set;
    } = [];
}
