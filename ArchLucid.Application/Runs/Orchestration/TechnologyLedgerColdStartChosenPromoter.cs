using ArchLucid.Contracts.Persistence.TechnologyLedger;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Cold-start promotion for agent topology proposals: when a role has no Chosen row yet,
///     the first agent-proposed candidate becomes <see cref="TechnologyLedgerStatus.Chosen" />.
/// </summary>
public static class TechnologyLedgerColdStartChosenPromoter
{
    public static TechnologyLedgerEntry Apply(
        TechnologyLedgerEntry candidate,
        IReadOnlyList<TechnologyLedgerEntry> existingRows)
    {
        ArgumentNullException.ThrowIfNull(candidate);
        ArgumentNullException.ThrowIfNull(existingRows);

        if (candidate.Source != TechnologyLedgerSource.AgentProposed)
            return candidate;

        bool hasChosenForRole = existingRows.Any(entry =>
            entry.Role == candidate.Role && entry.Status == TechnologyLedgerStatus.Chosen);

        if (hasChosenForRole)
            return candidate;

        candidate.Status = TechnologyLedgerStatus.Chosen;
        candidate.Rationale = AppendColdStartRationale(candidate.Rationale);

        return candidate;
    }

    private static string AppendColdStartRationale(string? rationale)
    {
        const string marker = "Cold-start: first agent proposal promoted to Chosen for this role.";

        if (string.IsNullOrWhiteSpace(rationale))
            return marker;

        if (rationale.Contains(marker, StringComparison.Ordinal))
            return rationale;

        return $"{rationale.Trim()} {marker}";
    }
}
