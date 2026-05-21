namespace ArchLucid.Application.Findings;

/// <summary>Post-commit LLM re-ranking of findings by business impact (persisted to <c>dbo.FindingRecords.PriorityRank</c>).</summary>
public interface IFindingPriorityReranker
{
    Task RerankForRunAsync(string runId, CancellationToken cancellationToken);
}
