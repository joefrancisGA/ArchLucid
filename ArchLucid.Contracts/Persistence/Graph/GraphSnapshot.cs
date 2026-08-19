namespace ArchLucid.Contracts.Persistence.Graph;

/// <summary>
///     Persisted typed architecture graph for a run.
///     SchemaVersion 1 shipped and stable as of 2026-05-26. Changes must be additive (new optional fields) or bump
///     <see cref="SchemaVersion" />. Field removals, type changes, and renames are breaking and require a new
///     SchemaVersion plus migration path.
/// </summary>
public class GraphSnapshot
{
    /// <summary>JSON contract version for forward-compatible deserialization (default <c>1</c>).</summary>
    public int SchemaVersion
    {
        get;
        set;
    } = 1;

    public Guid GraphSnapshotId
    {
        get;
        set;
    }

    public Guid ContextSnapshotId
    {
        get;
        set;
    }

    public Guid RunId
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public List<GraphNode> Nodes
    {
        get;
        set;
    } = [];

    public List<GraphEdge> Edges
    {
        get;
        set;
    } = [];

    public List<string> Warnings
    {
        get;
        set;
    } = [];
}

