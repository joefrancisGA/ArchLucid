using ArchLucid.Core.Retrieval;

namespace ArchLucid.Retrieval.Graph;

/// <summary>No-op graph neighbor expansion for unit tests.</summary>
public sealed class NullGraphRagNeighborExpander : IGraphRagNeighborExpander
{
    /// <inheritdoc />
    public Task<IReadOnlyList<RetrievalHit>> ExpandAsync(
        RetrievalQuery query,
        IReadOnlyList<RetrievalHit> hits,
        CancellationToken cancellationToken)
    {
        return Task.FromResult(hits ?? []);
    }
}
