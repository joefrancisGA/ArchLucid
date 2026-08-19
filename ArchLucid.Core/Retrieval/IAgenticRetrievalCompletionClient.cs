namespace ArchLucid.Core.Retrieval;

/// <summary>LLM-backed single-pass query expansion transforms (query rewrite, HyDE) for RAG-V2-002.</summary>
public interface IAgenticRetrievalCompletionClient
{
    Task<string> RewriteQueryAsync(string queryText, CancellationToken cancellationToken);

    Task<string> GenerateHydeDocumentAsync(string queryText, CancellationToken cancellationToken);

    /// <summary>Critique whether retrieved hits are sufficient; optional refined query when not (TB-878).</summary>
    Task<RetrievalCritiqueVerdict> CritiqueRetrievalAsync(
        string queryText,
        IReadOnlyList<RetrievalHit> hits,
        CancellationToken cancellationToken);
}
