using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Persistence.Queries;

/// <summary>Builds per-run disposition counts from review trail and active waivers.</summary>
internal static class RunFindingDispositionCoverageBuilder
{
    internal static RunFindingDispositionCoverage? Build(
        FindingsSnapshot? findingsSnapshot,
        IReadOnlyList<FindingReviewEventRecord> dispositionEvents,
        IReadOnlyList<RiskExceptionRecord> activeWaivers)
    {
        if (findingsSnapshot is null || findingsSnapshot.Findings.Count == 0)
            return null;

        HashSet<string> findingIds = findingsSnapshot.Findings
            .Select(static f => f.FindingId)
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Select(static id => id.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (findingIds.Count == 0)
            return null;

        Dictionary<string, FindingDisposition> latestDisposition = new(StringComparer.OrdinalIgnoreCase);

        foreach (FindingReviewEventRecord reviewEvent in dispositionEvents.OrderBy(static e => e.OccurredAtUtc))
        {
            if (reviewEvent.Disposition is null)
                continue;

            if (string.IsNullOrWhiteSpace(reviewEvent.FindingId))
                continue;

            string findingId = reviewEvent.FindingId.Trim();

            if (!findingIds.Contains(findingId))
                continue;

            latestDisposition[findingId] = reviewEvent.Disposition.Value;
        }

        HashSet<string> waivedIds = activeWaivers
            .Select(static w => w.FindingId)
            .Where(id => !string.IsNullOrWhiteSpace(id) && findingIds.Contains(id.Trim()))
            .Select(static id => id.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        int open = 0;
        int accepted = 0;
        int deferred = 0;
        int needsEvidence = 0;
        int remediated = 0;
        int rejected = 0;
        int waived = 0;

        foreach (string findingId in findingIds)
        {
            if (waivedIds.Contains(findingId))
            {
                waived++;
                continue;
            }

            if (!latestDisposition.TryGetValue(findingId, out FindingDisposition disposition))
            {
                open++;
                continue;
            }

            switch (disposition)
            {
                case FindingDisposition.Accepted:
                    accepted++;
                    break;
                case FindingDisposition.Deferred:
                    deferred++;
                    break;
                case FindingDisposition.NeedsEvidence:
                    needsEvidence++;
                    break;
                case FindingDisposition.Remediated:
                    remediated++;
                    break;
                case FindingDisposition.RejectedAsNotApplicable:
                    rejected++;
                    break;
                default:
                    open++;
                    break;
            }
        }

        return new RunFindingDispositionCoverage
        {
            OpenCount = open,
            AcceptedCount = accepted,
            DeferredCount = deferred,
            NeedsEvidenceCount = needsEvidence,
            RemediatedCount = remediated,
            RejectedNotApplicableCount = rejected,
            WaivedCount = waived,
        };
    }
}
