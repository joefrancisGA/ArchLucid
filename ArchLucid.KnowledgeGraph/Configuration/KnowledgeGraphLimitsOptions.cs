namespace ArchLucid.KnowledgeGraph.Configuration;

/// <summary>Configurable limits for knowledge graph snapshots and API responses.</summary>
public sealed class KnowledgeGraphLimitsOptions
{
    public const string SectionName = "ArchLucid:KnowledgeGraph";

    /// <summary>
    ///     When the builder produces more than this many nodes, the snapshot is truncated, dangling edges are removed,
    ///     and a warning is appended. Use <c>0</c> to disable (not recommended for untrusted ingestion).
    /// </summary>
    public int MaxNodes
    {
        get;
        set;
    } = 100_000;

    /// <summary>
    ///     Maximum nodes allowed for <c>GET /v1/graph/runs/{runId}</c> full JSON. Clients must use the paginated
    ///     <c>/nodes</c> endpoint when the graph is larger. Use <c>0</c> to disable the guard (not recommended).
    /// </summary>
    public int FullGraphResponseMaxNodes
    {
        get;
        set;
    } = 500;
}
