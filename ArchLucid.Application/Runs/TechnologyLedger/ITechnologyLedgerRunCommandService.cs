using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Runs.TechnologyLedger;

/// <summary>Run-scoped read/update commands for the Technology Ledger (operator baseline review API).</summary>
public interface ITechnologyLedgerRunCommandService
{
    Task<IReadOnlyList<TechnologyLedgerEntry>> GetByRunIdAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default);

    Task<TechnologyLedgerEntry> PatchEntryAsync(
        ScopeContext scope,
        Guid runId,
        string entryId,
        PatchTechnologyLedgerEntryCommand command,
        CancellationToken cancellationToken = default);
}
