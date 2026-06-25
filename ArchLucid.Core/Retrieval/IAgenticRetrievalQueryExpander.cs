namespace ArchLucid.Core.Retrieval;

/// <summary>Applies agentic retrieval transforms (query rewrite, HyDE) before vector search.</summary>
public interface IAgenticRetrievalQueryExpander
{
    Task<AgenticRetrievalQueryPlan> ExpandAsync(string queryText, CancellationToken cancellationToken);
}
