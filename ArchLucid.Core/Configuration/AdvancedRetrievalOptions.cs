namespace ArchLucid.Core.Configuration;

/// <summary>Configuration for Graph-RAG and agentic retrieval (RAG-V2-001 / RAG-V2-002).</summary>
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

    /// <summary>When true, expands knowledge-graph hits with 1-hop neighbors at query time.</summary>
    public bool EnableGraphRag
    {
        get;
        set;
    } = true;

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

    public TimeSpan GetEffectiveExpansionTimeout()
    {
        return TimeSpan.FromSeconds(Math.Clamp(ExpansionTimeoutSeconds, 1, 30));
    }
}
