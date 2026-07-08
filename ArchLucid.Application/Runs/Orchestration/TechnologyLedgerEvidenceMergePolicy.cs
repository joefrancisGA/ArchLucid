using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Resolves evidence ledger candidates against existing rows (Prompt 2 user seeding + prior evidence).
/// </summary>
public static class TechnologyLedgerEvidenceMergePolicy
{
    /// <summary>
    ///     Returns the entry to persist, or <see langword="null" /> when the candidate should be skipped.
    /// </summary>
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

        if (chosen.ProviderFamily == candidate.ProviderFamily)
            return null;

        return new TechnologyLedgerEntry
        {
            EntryId = candidate.EntryId,
            RunId = candidate.RunId,
            Role = candidate.Role,
            TechnologyName = candidate.TechnologyName,
            ProviderFamily = candidate.ProviderFamily,
            Status = TechnologyLedgerStatus.Alternative,
            Source = TechnologyLedgerSource.Evidence,
            EvidenceRef = candidate.EvidenceRef,
            Rationale =
                $"Evidence suggests {candidate.ProviderFamily} while existing chosen entry is {chosen.ProviderFamily}.",
            IsLocked = false,
            CreatedUtc = candidate.CreatedUtc,
            UpdatedUtc = candidate.UpdatedUtc,
        };
    }
}
