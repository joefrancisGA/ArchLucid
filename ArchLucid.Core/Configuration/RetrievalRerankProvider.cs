namespace ArchLucid.Core.Configuration;

/// <summary>V1 retrieval rerank backends (Improvement #23).</summary>
public enum RetrievalRerankProvider
{
    /// <summary>Azure AI Search semantic ranker when search is configured; lexical overlap fallback in Development.</summary>
    AzureAiSearchSemantic = 0,
}
