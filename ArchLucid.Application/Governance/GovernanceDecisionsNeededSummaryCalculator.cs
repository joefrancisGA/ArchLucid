using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Data.Repositories;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

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
                continue;

            if (entry.IsStale)
                distinctFindingWork.Add(entry.FindingId);

            if (string.IsNullOrWhiteSpace(entry.OwnerUserId) && IsHighSeverity(entry.Severity))
                distinctFindingWork.Add(entry.FindingId);
        }

        foreach (IGrouping<string, FindingReviewEventRecord> group in recentDispositionEvents
                     .Where(static e => e.Disposition == Disposition.NeedsEvidence)
                     .GroupBy(static e => e.FindingId, StringComparer.OrdinalIgnoreCase))
        {
            distinctFindingWork.Add(group.Key);
        }

        foreach (FindingReviewEventRecord reviewEvent in recentDispositionEvents)
        {
            if (reviewEvent.Disposition != Disposition.Deferred)
                continue;

            if (reviewEvent.RevisitDueUtc is null || reviewEvent.RevisitDueUtc > nowUtc)
                continue;

            if (string.IsNullOrWhiteSpace(reviewEvent.FindingId))
                continue;

            distinctFindingWork.Add(reviewEvent.FindingId);
        }

        foreach (RiskExceptionRecord waiver in activeWaivers)
        {
            if (string.IsNullOrWhiteSpace(waiver.FindingId))
                continue;

            DateTimeOffset windowEnd = nowUtc.AddDays(GovernanceWaiverExpiryWindow.DefaultExpiringWithinDays);

            if (waiver.ExpiresAtUtc >= nowUtc && waiver.ExpiresAtUtc <= windowEnd)
                distinctFindingWork.Add(waiver.FindingId);
        }

        // Approvals are not finding-keyed; they always add to the total separately.
        return pendingApprovals + distinctFindingWork.Count;
    }

    private static bool IsHighSeverity(string severity)
    {
        if (string.IsNullOrWhiteSpace(severity))
            return false;

        return severity.Contains("high", StringComparison.OrdinalIgnoreCase)
               || severity.Contains("critical", StringComparison.OrdinalIgnoreCase);
    }
}
