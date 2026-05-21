using ArchLucid.Contracts.Agents;

namespace ArchLucid.Application.Agents.Evidence;

public interface IEvidenceProposalQueryService
{
    Task<IReadOnlyList<EvidenceProposalListItem>> ListPendingAsync(CancellationToken cancellationToken = default);
}
