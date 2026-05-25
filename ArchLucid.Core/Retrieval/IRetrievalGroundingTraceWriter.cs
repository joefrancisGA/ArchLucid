namespace ArchLucid.Core.Retrieval;

/// <summary>Persists per-agent retrieval grounding traces for eval and support bundles.</summary>
public interface IRetrievalGroundingTraceWriter
{
    Task AppendAsync(RetrievalGroundingTraceInsert insert, CancellationToken cancellationToken);
}
