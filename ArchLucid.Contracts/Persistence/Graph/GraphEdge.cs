using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Persistence.Graph;

/// <summary>
///     Directed edge in a <see cref="GraphSnapshot" />.
///     SchemaVersion 1 shipped and stable as of 2026-05-26. Changes must be additive (new optional fields) or bump
///     <see cref="GraphSnapshot.SchemaVersion" />. Field removals, type changes, and renames are breaking.
/// </summary>
public class GraphEdge
{
    private string edgeId = string.Empty;

    public string EdgeId
    {
        get => edgeId;
        set => edgeId = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string fromNodeId = string.Empty;

    public string FromNodeId
    {
        get => fromNodeId;
        set => fromNodeId = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string toNodeId = string.Empty;

    public string ToNodeId
    {
        get => toNodeId;
        set => toNodeId = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string edgeType = string.Empty;

    public string EdgeType
    {
        get => edgeType;
        set => edgeType = ContractCollectionDefaults.CoalesceRequired(value);
    }

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

    /// <summary>
    ///     Additive SchemaVersion 1 field. Missing JSON deserializes as null (see <c>HumanAssertion</c>, <c>ObservedFact</c>).
    /// </summary>
    public string? ProvenanceKind
    {
        get;
        set;
    }

    /// <summary>
    ///     Additive SchemaVersion 1 field. Merge-time declared-connection id; missing JSON deserializes as null.
    /// </summary>
    public string? DeclaredConnectionId
    {
        get;
        set;
    }

    private Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> Properties
    {
        get => properties;
        set => properties = ContractCollectionDefaults.CoalesceStringDictionaryOrdinalIgnoreCase(value);
    }

    /// <summary>
    ///     Optional inference explanation (deterministic heuristic text or propagated agent narration).
    /// </summary>
    public string? ReasoningTrace
    {
        get;
        set;
    }
}

