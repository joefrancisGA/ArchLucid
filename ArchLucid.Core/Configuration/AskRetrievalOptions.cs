namespace ArchLucid.Core.Configuration;

/// <summary>Ask-scoped retrieval cost controls (query expansion + reranking).</summary>
public sealed class AskRetrievalOptions
{
    public const string SectionPath = "Retrieval:Ask";

    /// <summary>
    ///     When true, Ask sets <c>SkipQueryExpansion</c> and <c>SkipReranking</c> on its
    ///     <see cref="ArchLucid.Core.Retrieval.RetrievalQuery"/> so Staging can avoid expensive LLM rewrite / HyDE / rerank.
    ///     Default false (Production); Staging appsettings sets true.
    /// </summary>
    public bool SkipExpensiveStages
    {
        get;
        set;
    }
}
