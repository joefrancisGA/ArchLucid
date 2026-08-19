namespace ArchLucid.Application.Agents.Evidence;

public interface IEvidenceProposalPromoter
{
    Task<Guid> PromoteAsync(string resultId, CancellationToken cancellationToken = default);
}
