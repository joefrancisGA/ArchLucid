namespace ArchLucid.Contracts.Persistence.Graph;

/// <summary>
///     Directed edge in a <see cref="GraphSnapshot" />.
///     SchemaVersion 1 shipped and stable as of 2026-05-26. Changes must be additive (new optional fields) or bump
///     <see cref="GraphSnapshot.SchemaVersion" />. Field removals, type changes, and renames are breaking.
/// </summary>
public class GraphEdge
{
    public string EdgeId
    {
        get;
        set;
    } = null!;

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

    public string EdgeType
    {
        get;
        set;
    } = null!;

    public string? Label
    {
        get;
        set;
    }

    /// <summary>
    ///     Relative strength for traversals and deduplication (explicit ingestion-backed edges use ~1.0; broad heuristics
    ///     lower).
    /// </summary>
    public double Weight
    {
        get;
        set;
    } = 1d;

    /// <summary>
    ///     When set, identifies which inferrer rule produced this edge (see <see cref="GraphEdgeInferenceSources" />).
    /// </summary>
    public string? InferenceSource
    {
        get;
        set;
    }

    public Dictionary<string, string> Properties
    {
        get;
        set;
    } = [];

    /// <summary>
    ///     Optional inference explanation (deterministic heuristic text or propagated agent narration).
    /// </summary>
    public string? ReasoningTrace
    {
        get;
        set;
    }
}

