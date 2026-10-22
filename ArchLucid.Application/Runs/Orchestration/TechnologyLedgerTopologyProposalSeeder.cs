using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Runs.Orchestration;

public sealed class TechnologyLedgerTopologyProposalSeeder(
    ITechnologyLedgerRepository technologyLedgerRepository,
    IScopeContextProvider scopeContextProvider,
    TimeProvider timeProvider)
{
    private readonly ITechnologyLedgerRepository _technologyLedgerRepository =
        technologyLedgerRepository ?? throw new ArgumentNullException(nameof(technologyLedgerRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task SeedFromTopologyResultAsync(
        string runId,
        ArchitectureRequest request,
        AgentResult topologyResult,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(topologyResult);

        AgentTopologyProposal? proposal = topologyResult.ProposedChanges;

        if (proposal is null || (proposal.AddedServices.Count == 0 && proposal.AddedDatastores.Count == 0))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<TechnologyLedgerEntry> existingRows =
            await _technologyLedgerRepository.GetByRunIdAsync(scope, runId, cancellationToken);

        DateTime utcNow = _timeProvider.GetUtcNow().UtcDateTime;
        IReadOnlyList<TechnologyLedgerEntry> candidates =
            TechnologyLedgerTopologyProposalMapper.MapCandidates(runId, request, proposal, utcNow);

        foreach (TechnologyLedgerEntry candidate in candidates)
        {
            TechnologyLedgerEntry? resolved = TechnologyLedgerAgentProposalMergePolicy.Resolve(candidate, existingRows);

            if (resolved is null)
                continue;

            resolved = TechnologyLedgerColdStartChosenPromoter.Apply(resolved, existingRows);

            await _technologyLedgerRepository.AddAsync(resolved, cancellationToken);
            existingRows = await _technologyLedgerRepository.GetByRunIdAsync(scope, runId, cancellationToken);
        }
    }
}
