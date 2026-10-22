using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Persistence.Graph;

/// <summary>
///     Node in a <see cref="GraphSnapshot" />.
///     SchemaVersion 1 shipped and stable as of 2026-05-26. Changes must be additive (new optional fields) or bump
///     <see cref="GraphSnapshot.SchemaVersion" />. Field removals, type changes, and renames are breaking.
/// </summary>
public class GraphNode
{
    private string nodeId = string.Empty;

    public string NodeId
    {
        get => nodeId;
        set => nodeId = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string nodeType = string.Empty;

    public string NodeType
    {
        get => nodeType;
        set => nodeType = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string label = string.Empty;

    public string Label
    {
        get => label;
        set => label = ContractCollectionDefaults.CoalesceRequired(value);
    }

    public string? Category
    {
        get;
        set;
    }

    public string? SourceType
    {
        get;
        set;
    }

    public string? SourceId
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
    ///     Optional agent/heuristic narration carried into graph projection for operator explainability.
    /// </summary>
    public string? ReasoningTrace
    {
        get;
        set;
    }
}

