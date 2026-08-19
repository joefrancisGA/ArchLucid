namespace ArchLucid.Core.Configuration;

/// <summary>Configuration for Graph-RAG (RAG-V2-001) and single-pass query expansion (RAG-V2-002).</summary>
public sealed class AdvancedRetrievalOptions
{
    public const string SectionPath = "Retrieval:Advanced";

    /// <summary>Master switch for advanced retrieval pipeline stages.</summary>
    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>When true, rewrites the user query before embedding.</summary>
    public bool EnableQueryRewrite
    {
        get;
        set;
    } = true;

    /// <summary>When true, embeds a hypothetical document instead of the raw query (HyDE).</summary>
    public bool EnableHyde
    {
        get;
        set;
    } = true;

    /// <summary>When true, expands knowledge-graph hits with bounded multi-hop neighbor traversal at query time.</summary>
    public bool EnableGraphRag
    {
        get;
        set;
    } = true;

    /// <summary>
    ///     When true, detects graph communities at index time, summarizes each with LLM, and indexes community corpus chunks.
    ///     Default off (TB-877); requires <see cref="EnableGraphRag" /> for retrieval posture honesty.
    /// </summary>
    public bool EnableCommunitySummarization
    {
        get;
        set;
    }

    /// <summary>Maximum graph hops traversed from each seed hit (cycle-safe breadth-first expansion).</summary>
    public int MaxGraphTraversalHops
    {
        get;
        set;
    } = 2;

    /// <summary>Maximum neighbor nodes appended per matched graph hit.</summary>
    public int MaxGraphNeighborNodes
    {
        get;
        set;
    } = 8;

    /// <summary>
    ///     Maximum seconds to wait for LLM query rewrite / HyDE before falling back to heuristics (CI #2268: unbounded
    ///     completion waits can hang retrieval search when the model endpoint stalls).
    /// </summary>
    public int ExpansionTimeoutSeconds
    {
        get;
        set;
    } = 5;

    public int GetEffectiveMaxGraphNeighborNodes()
    {
        return Math.Clamp(MaxGraphNeighborNodes, 1, 32);
    }

    public int GetEffectiveMaxGraphTraversalHops()
    {
        return Math.Clamp(MaxGraphTraversalHops, 1, 4);
    }

    public TimeSpan GetEffectiveExpansionTimeout()
    {
        return TimeSpan.FromSeconds(Math.Clamp(ExpansionTimeoutSeconds, 1, 30));
    }

    /// <summary>When true, runs bounded retrieve-critique-retry after single-pass expansion (TB-878).</summary>
    public bool EnableIterativeRetrieveCritiqueRetry
    {
        get;
        set;
    }

    /// <summary>Maximum retrieval rounds including the initial pass (default 2).</summary>
    public int MaxIterativeRetrievalRounds
    {
        get;
        set;
    } = 2;

    public int GetEffectiveMaxIterativeRetrievalRounds()
    {
        return Math.Clamp(MaxIterativeRetrievalRounds, 1, 4);
    }
}
