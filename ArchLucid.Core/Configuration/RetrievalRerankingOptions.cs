namespace ArchLucid.Core.Configuration;

/// <summary>Configuration for post-vector retrieval reranking (Improvement #23).</summary>
public sealed class RetrievalRerankingOptions
{
    public const string SectionPath = "Retrieval:Reranking";

    /// <summary>When false, candidates pass through in vector-index order.</summary>
    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>Maximum candidates passed to the reranker (hard cap 50).</summary>
    public int MaxCandidates
    {
        get;
        set;
    } = 50;

    /// <summary>Rerank backend; V1 supports Azure AI Search semantic ranker only.</summary>
    public RetrievalRerankProvider Provider
    {
        get;
        set;
    } = RetrievalRerankProvider.AzureAiSearchSemantic;

    /// <summary>Clamps <see cref="MaxCandidates" /> to [1, 50].</summary>
    public int GetEffectiveMaxCandidates()
    {
        return Math.Clamp(MaxCandidates, 1, 50);
    }
}
