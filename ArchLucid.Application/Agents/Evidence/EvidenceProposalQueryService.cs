using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Agents.Evidence;

public sealed class EvidenceProposalQueryService(
    IAgentResultRepository agentResultRepository,
    IScopeContextProvider scopeContextProvider) : IEvidenceProposalQueryService
{
    private readonly IAgentResultRepository _agentResultRepository =
        agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public Task<IReadOnlyList<EvidenceProposalListItem>> ListPendingAsync(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        return _agentResultRepository.ListEvidenceProposalsAsync(scope, cancellationToken);
    }
}
