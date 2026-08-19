using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.Application.Agents.Evidence;

public interface IEvidenceProposalQueryService
{
    Task<IReadOnlyList<EvidenceProposalListItem>> ListPendingAsync(CancellationToken cancellationToken = default);
}
