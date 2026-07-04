namespace ArchLucid.Core.Retrieval;

/// <summary>LLM-backed single-pass query expansion transforms (query rewrite, HyDE) for RAG-V2-002.</summary>
public interface IAgenticRetrievalCompletionClient
{
    Task<string> RewriteQueryAsync(string queryText, CancellationToken cancellationToken);

    Task<string> GenerateHydeDocumentAsync(string queryText, CancellationToken cancellationToken);
}
