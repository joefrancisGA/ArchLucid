namespace ArchLucid.Core.Retrieval;

/// <summary>Reads persisted retrieval grounding traces for forensic and explainability surfaces.</summary>
public interface IRetrievalGroundingTraceReader
{
    Task<IReadOnlyList<RetrievalGroundingTraceRecord>> GetByRunIdAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid runId,
        CancellationToken cancellationToken);
}
