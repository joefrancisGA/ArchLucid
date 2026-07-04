namespace ArchLucid.Core.Retrieval;

/// <summary>Expands knowledge-graph retrieval hits with bounded multi-hop relational context.</summary>
public interface IGraphRagNeighborExpander
{
    Task<IReadOnlyList<RetrievalHit>> ExpandAsync(
        RetrievalQuery query,
        IReadOnlyList<RetrievalHit> hits,
        CancellationToken cancellationToken);
}
