namespace ArchLucid.Core.Retrieval;

/// <summary>LLM-backed transforms for agentic retrieval (query rewrite, HyDE).</summary>
public interface IAgenticRetrievalCompletionClient
{
    Task<string> RewriteQueryAsync(string queryText, CancellationToken cancellationToken);

    Task<string> GenerateHydeDocumentAsync(string queryText, CancellationToken cancellationToken);
}
