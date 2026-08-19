namespace ArchLucid.Core.Retrieval;

/// <summary>Applies single-pass query expansion (query rewrite, HyDE) before vector search.</summary>
public interface IAgenticRetrievalQueryExpander
{
    Task<AgenticRetrievalQueryPlan> ExpandAsync(string queryText, CancellationToken cancellationToken);
}
