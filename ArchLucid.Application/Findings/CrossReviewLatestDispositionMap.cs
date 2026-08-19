using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Reduces a finding review trail to the latest recorded disposition per finding (TB-2194), which is what the
///     lifecycle resolver needs to tell a confirmed remediation apart from an unexplained drop-out.
/// </summary>
public static class CrossReviewLatestDispositionMap
{
    public static IReadOnlyDictionary<string, FindingDisposition> Build(
        IReadOnlyCollection<FindingReviewEventRecord> reviewEvents)
    {
        ArgumentNullException.ThrowIfNull(reviewEvents);

        Dictionary<string, FindingDisposition> latest = new(StringComparer.OrdinalIgnoreCase);

        // Oldest first so a later decision overwrites an earlier one; the repository returns newest-first, and callers
        // should not have to care which order they got.
        foreach (FindingReviewEventRecord reviewEvent in reviewEvents.OrderBy(static record => record.OccurredAtUtc))
        {
            if (reviewEvent.Disposition is null)
                continue;

            if (string.IsNullOrWhiteSpace(reviewEvent.FindingId))
                continue;

            latest[reviewEvent.FindingId.Trim()] = reviewEvent.Disposition.Value;
        }

        return latest;
    }
}
