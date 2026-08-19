using ArchLucid.Core.Retrieval;

namespace ArchLucid.Retrieval.Agentic;

/// <summary>Deterministic single-pass query expansion transforms for tests and fail-open paths.</summary>
public sealed class HeuristicAgenticRetrievalCompletionClient : IAgenticRetrievalCompletionClient
{
    /// <inheritdoc />
    public Task<string> RewriteQueryAsync(string queryText, CancellationToken cancellationToken)
    {
        return Task.FromResult(AgenticRetrievalHeuristics.RewriteQuery(queryText));
    }

    /// <inheritdoc />
    public Task<string> GenerateHydeDocumentAsync(string queryText, CancellationToken cancellationToken)
    {
        return Task.FromResult(AgenticRetrievalHeuristics.GenerateHydeDocument(queryText));
    }

    /// <inheritdoc />
    public Task<RetrievalCritiqueVerdict> CritiqueRetrievalAsync(
        string queryText,
        IReadOnlyList<RetrievalHit> hits,
        CancellationToken cancellationToken)
    {
        return Task.FromResult(AgenticRetrievalHeuristics.CritiqueRetrieval(queryText, hits));
    }
}
