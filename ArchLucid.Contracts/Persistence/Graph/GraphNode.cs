namespace ArchLucid.Contracts.Persistence.Graph;

/// <summary>
///     Node in a <see cref="GraphSnapshot" />.
///     SchemaVersion 1 shipped and stable as of 2026-05-26. Changes must be additive (new optional fields) or bump
///     <see cref="GraphSnapshot.SchemaVersion" />. Field removals, type changes, and renames are breaking.
/// </summary>
public class GraphNode
{
    public string NodeId
    {
        get;
        set;
    } = null!;

    public string NodeType
    {
        get;
        set;
    } = null!;

    public string Label
    {
        get;
        set;
    } = null!;

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

    public Dictionary<string, string> Properties
    {
        get;
        set;
    } = [];

    /// <summary>
    ///     Optional agent/heuristic narration carried into graph projection for operator explainability.
    /// </summary>
    public string? ReasoningTrace
    {
        get;
        set;
    }
}

