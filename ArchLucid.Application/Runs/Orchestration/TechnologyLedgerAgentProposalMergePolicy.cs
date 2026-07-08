using ArchLucid.Contracts.Persistence.TechnologyLedger;

namespace ArchLucid.Application.Runs.Orchestration;

public static class TechnologyLedgerAgentProposalMergePolicy
{
    public static TechnologyLedgerEntry? Resolve(
        TechnologyLedgerEntry candidate,
        IReadOnlyList<TechnologyLedgerEntry> existingRows)
    {
        ArgumentNullException.ThrowIfNull(candidate);
        ArgumentNullException.ThrowIfNull(existingRows);

        TechnologyLedgerEntry? chosen = existingRows
            .FirstOrDefault(entry => entry.Role == candidate.Role && entry.Status == TechnologyLedgerStatus.Chosen);

        if (chosen is null)
            return candidate;

        if (chosen.IsLocked)
            return null;

        if (chosen.ProviderFamily == candidate.ProviderFamily)
            return null;

        return candidate;
    }
}
