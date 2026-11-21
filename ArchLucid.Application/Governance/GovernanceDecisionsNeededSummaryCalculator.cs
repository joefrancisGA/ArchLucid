using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

/// <summary>Aggregates governance decisions-needed counts with distinct finding union semantics (TB-150).</summary>
public static class GovernanceDecisionsNeededSummaryCalculator
{
    public static int ComputeTotalDecisionItems(
        int pendingApprovals,
        ArchitectureRiskRegisterResponse register,
        IReadOnlyList<FindingReviewEventRecord> recentDispositionEvents,
        IReadOnlyList<RiskExceptionRecord> activeWaivers,
        DateTimeOffset nowUtc)
    {
        ArgumentNullException.ThrowIfNull(register);
        ArgumentNullException.ThrowIfNull(recentDispositionEvents);
        ArgumentNullException.ThrowIfNull(activeWaivers);

        HashSet<string> distinctFindingWork = new(StringComparer.OrdinalIgnoreCase);

        foreach (ArchitectureRiskRegisterEntry entry in register.Entries)
        {
            if (string.IsNullOrWhiteSpace(entry.FindingId))
            {
                continue;
            }

            if (entry.IsStale)
            {
                distinctFindingWork.Add(entry.FindingId);
            }

            if (string.IsNullOrWhiteSpace(entry.OwnerUserId) && IsHighSeverity(entry.Severity))
            {
                distinctFindingWork.Add(entry.FindingId);
            }
        }

        foreach (FindingReviewEventRecord reviewEvent in GovernanceDigestOpenDispositionSelector.SelectNeedsEvidence(recentDispositionEvents))
        {
            if (string.IsNullOrWhiteSpace(reviewEvent.FindingId))
            {
                continue;
            }

            distinctFindingWork.Add(reviewEvent.FindingId);
        }

        foreach (FindingReviewEventRecord reviewEvent in GovernanceDigestOpenDispositionSelector.SelectDeferredDue(recentDispositionEvents, nowUtc))
        {
            if (string.IsNullOrWhiteSpace(reviewEvent.FindingId))
            {
                continue;
            }

            distinctFindingWork.Add(reviewEvent.FindingId);
        }

        DateTimeOffset waiverWindowEnd = nowUtc.AddDays(GovernanceWaiverExpiryWindow.DefaultExpiringWithinDays);
        foreach (RiskExceptionRecord waiver in activeWaivers)
        {
            if (waiver.Status != RiskExceptionStatus.Active || string.IsNullOrWhiteSpace(waiver.FindingId))
            {
                continue;
            }

            if (waiver.ExpiresAtUtc >= nowUtc && waiver.ExpiresAtUtc <= waiverWindowEnd)
            {
                distinctFindingWork.Add(waiver.FindingId);
            }
        }

        // Approvals are not finding-keyed; they always add to the total separately.
        return pendingApprovals + distinctFindingWork.Count;
    }

    private static bool IsHighSeverity(string severity)
    {
        if (string.IsNullOrWhiteSpace(severity))
            return false;

        string normalized = severity.Trim();
        return string.Equals(normalized, "High", StringComparison.OrdinalIgnoreCase)
               || string.Equals(normalized, "Critical", StringComparison.OrdinalIgnoreCase)
               || string.Equals(normalized, "Error", StringComparison.OrdinalIgnoreCase);
    }
}
