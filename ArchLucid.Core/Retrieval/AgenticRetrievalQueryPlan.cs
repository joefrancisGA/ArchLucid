namespace ArchLucid.Core.Retrieval;

/// <summary>Resolved query plan after optional rewrite and HyDE expansion.</summary>
public sealed class AgenticRetrievalQueryPlan
{
    /// <summary>Original caller query text.</summary>
    public required string OriginalQueryText
    {
        get;
        init;
    }

    /// <summary>Query text used for lexical reranking.</summary>
    public required string RerankQueryText
    {
        get;
        init;
    }

    /// <summary>Text embedded for vector search (HyDE doc when enabled, otherwise rewritten query).</summary>
    public required string EmbedText
    {
        get;
        init;
    }

    /// <summary>True when HyDE produced the embed text.</summary>
    public bool UsedHyde
    {
        get;
        init;
    }

    /// <summary>True when query rewrite changed the original text.</summary>
    public bool UsedQueryRewrite
    {
        get;
        init;
    }
}
