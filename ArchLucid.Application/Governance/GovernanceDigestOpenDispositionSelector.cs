using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;

using Disposition = global::ArchLucid.Contracts.Findings.FindingDisposition;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Digest decision counts follow the latest disposition per finding. The 30-day review window still contains
///     the earlier NeedsEvidence or Deferred row after a later remediation, so those rows are not open work.
/// </summary>
public static class GovernanceDigestOpenDispositionSelector
{
    public static IReadOnlyList<FindingReviewEventRecord> SelectNeedsEvidence(
        IReadOnlyList<FindingReviewEventRecord> events)
    {
        ArgumentNullException.ThrowIfNull(events);

        return SelectLatest(events)
            .Where(static reviewEvent => reviewEvent.Disposition == Disposition.NeedsEvidence)
            .OrderByDescending(static reviewEvent => reviewEvent.OccurredAtUtc)
            .ToList();
    }

    public static IReadOnlyList<FindingReviewEventRecord> SelectDeferredDue(
        IReadOnlyList<FindingReviewEventRecord> events,
        DateTimeOffset nowUtc)
    {
        ArgumentNullException.ThrowIfNull(events);

        return SelectLatest(events)
            .Where(reviewEvent =>
                reviewEvent.Disposition == Disposition.Deferred
                && reviewEvent.RevisitDueUtc is not null
                && reviewEvent.RevisitDueUtc <= nowUtc)
            .OrderByDescending(static reviewEvent => reviewEvent.OccurredAtUtc)
            .ToList();
    }

    private static IReadOnlyList<FindingReviewEventRecord> SelectLatest(
        IReadOnlyList<FindingReviewEventRecord> events)
    {
        if (events.Count == 0)
            return [];

        return CrossReviewLatestDispositionMap.SelectLatestEvents(events);
    }
}
