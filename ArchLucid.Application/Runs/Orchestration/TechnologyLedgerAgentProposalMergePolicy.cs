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

        if (HasMatchingProposal(candidate, existingRows))
            return null;

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

    private static bool HasMatchingProposal(
        TechnologyLedgerEntry candidate,
        IReadOnlyList<TechnologyLedgerEntry> existingRows)
    {
        foreach (TechnologyLedgerEntry existing in existingRows)
        {
            if (existing.Role != candidate.Role)
                continue;

            if (EvidenceRefsMatch(existing.EvidenceRef, candidate.EvidenceRef))
                return true;

            if (existing.ProviderFamily != candidate.ProviderFamily)
                continue;

            if (TechnologyNamesMatch(existing.TechnologyName, candidate.TechnologyName)
                && !HasDistinctEvidenceRefs(existing.EvidenceRef, candidate.EvidenceRef))
                return true;
        }

        return false;
    }

    private static bool HasDistinctEvidenceRefs(string? left, string? right) =>
        !string.IsNullOrWhiteSpace(left)
        && !string.IsNullOrWhiteSpace(right)
        && !EvidenceRefsMatch(left, right);

    private static bool TechnologyNamesMatch(string left, string right) =>
        string.Equals(NormalizeTechnologyName(left), NormalizeTechnologyName(right), StringComparison.OrdinalIgnoreCase);

    private static string NormalizeTechnologyName(string value)
    {
        string trimmed = value.Trim();

        if (trimmed.Length == 0)
            return string.Empty;

        return string.Join(' ', trimmed.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
    }

    private static bool EvidenceRefsMatch(string? left, string? right) =>
        !string.IsNullOrWhiteSpace(left)
        && !string.IsNullOrWhiteSpace(right)
        && string.Equals(left.Trim(), right.Trim(), StringComparison.OrdinalIgnoreCase);
}
