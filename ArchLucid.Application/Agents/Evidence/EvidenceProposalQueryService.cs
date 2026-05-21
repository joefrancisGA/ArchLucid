using ArchLucid.Contracts.Agents;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Agents.Evidence;

public sealed class EvidenceProposalQueryService(IAgentResultRepository agentResultRepository)
    : IEvidenceProposalQueryService
{
    private readonly IAgentResultRepository _agentResultRepository =
        agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));

    public Task<IReadOnlyList<EvidenceProposalListItem>> ListPendingAsync(CancellationToken cancellationToken = default) =>
        _agentResultRepository.ListEvidenceProposalsAsync(cancellationToken);
}
