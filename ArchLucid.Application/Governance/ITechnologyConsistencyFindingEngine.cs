using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Governance;

/// <summary>Deterministic Technology Ledger consistency checks for pre-commit evaluation.</summary>
public interface ITechnologyConsistencyFindingEngine
{
    IReadOnlyList<Finding> Evaluate(
        string runId,
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries,
        TechnologyConsistencyFindingEngineOptions options);
}
