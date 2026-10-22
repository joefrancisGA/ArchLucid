using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Findings;

/// <summary>Pure classifier for open governance commitments from trail, waivers, and remediation due dates.</summary>
public static class OpenCommitmentClassifier
{
    public static IReadOnlyList<OpenCommitmentSignal> Classify(
        IReadOnlyList<FindingReviewEventRecord> trailEvents,
        IReadOnlyList<RiskExceptionRecord> activeWaivers,
        IReadOnlyDictionary<string, DateTimeOffset?> remediationDueByFindingId,
        DateTimeOffset now,
        int waiverExpiryWarningDays)
    {
        ArgumentNullException.ThrowIfNull(trailEvents);
        ArgumentNullException.ThrowIfNull(activeWaivers);
        ArgumentNullException.ThrowIfNull(remediationDueByFindingId);

        Dictionary<string, FindingDisposition> latestDisposition = BuildLatestDispositionMap(trailEvents);
        Dictionary<string, FindingReviewEventRecord> latestEventByFindingId =
            BuildLatestEventByFindingId(trailEvents);

        List<OpenCommitmentSignal> signals = [];

        foreach (KeyValuePair<string, FindingReviewEventRecord> pair in latestEventByFindingId)
        {
            string findingId = pair.Key;
            FindingReviewEventRecord latestEvent = pair.Value;

            if (!latestDisposition.TryGetValue(findingId, out FindingDisposition disposition))
            {
                continue;
            }

            if (disposition == FindingDisposition.Deferred
                && latestEvent.RevisitDueUtc is DateTimeOffset revisitDue
                && revisitDue < now)
            {
                int daysOverdue = (int)Math.Floor((now - revisitDue).TotalDays);
                signals.Add(new OpenCommitmentSignal
                {
                    Kind = OpenCommitmentSignalKind.OverdueDeferral,
                    SourceFindingId = findingId,
                    DueOrExpiryUtc = revisitDue,
                    ReasonToken = "overdue-deferral",
                    DaysOverdueOrUntilExpiry = daysOverdue,
                });
            }

            if (disposition == FindingDisposition.NeedsEvidence)
            {
                signals.Add(new OpenCommitmentSignal
                {
                    Kind = OpenCommitmentSignalKind.UnansweredEvidenceRequest,
                    SourceFindingId = findingId,
                    DueOrExpiryUtc = latestEvent.OccurredAtUtc,
                    ReasonToken = "unanswered-evidence-request",
                    DaysOverdueOrUntilExpiry = (int)Math.Floor((now - latestEvent.OccurredAtUtc).TotalDays),
                });
            }
        }

        foreach (RiskExceptionRecord waiver in activeWaivers)
        {
            if (string.IsNullOrWhiteSpace(waiver.FindingId))
            {
                continue;
            }

            string findingId = waiver.FindingId.Trim();
            DateTimeOffset expiresAt = waiver.ExpiresAtUtc;

            if (expiresAt < now)
            {
                int daysOverdue = (int)Math.Floor((now - expiresAt).TotalDays);
                signals.Add(new OpenCommitmentSignal
                {
                    Kind = OpenCommitmentSignalKind.ExpiredWaiver,
                    SourceFindingId = findingId,
                    DueOrExpiryUtc = expiresAt,
                    ReasonToken = "expired-waiver",
                    DaysOverdueOrUntilExpiry = daysOverdue,
                });

                continue;
            }

            DateTimeOffset warningThreshold = now.AddDays(waiverExpiryWarningDays);

            if (expiresAt <= warningThreshold)
            {
                int daysUntilExpiry = (int)Math.Ceiling((expiresAt - now).TotalDays);
                signals.Add(new OpenCommitmentSignal
                {
                    Kind = OpenCommitmentSignalKind.ExpiringWaiver,
                    SourceFindingId = findingId,
                    DueOrExpiryUtc = expiresAt,
                    ReasonToken = "expiring-waiver",
                    DaysOverdueOrUntilExpiry = daysUntilExpiry,
                });
            }
        }

        foreach (KeyValuePair<string, DateTimeOffset?> pair in remediationDueByFindingId)
        {
            if (pair.Value is not DateTimeOffset remediationDue)
            {
                continue;
            }

            if (remediationDue >= now)
            {
                continue;
            }

            string findingId = pair.Key;

            if (latestDisposition.TryGetValue(findingId, out FindingDisposition disposition)
                && disposition == FindingDisposition.Remediated)
            {
                continue;
            }

            int daysOverdue = (int)Math.Floor((now - remediationDue).TotalDays);
            signals.Add(new OpenCommitmentSignal
            {
                Kind = OpenCommitmentSignalKind.OverdueRemediation,
                SourceFindingId = findingId,
                DueOrExpiryUtc = remediationDue,
                ReasonToken = "overdue-remediation",
                DaysOverdueOrUntilExpiry = daysOverdue,
            });
        }

        return signals;
    }

    private static Dictionary<string, FindingDisposition> BuildLatestDispositionMap(
        IReadOnlyList<FindingReviewEventRecord> events)
    {
        Dictionary<string, FindingDisposition> latestDisposition = new(StringComparer.OrdinalIgnoreCase);

        foreach (FindingReviewEventRecord eventRecord in events.OrderBy(static e => e.OccurredAtUtc))
        {
            if (string.IsNullOrWhiteSpace(eventRecord.FindingId))
            {
                continue;
            }

            if (eventRecord.Disposition is null)
            {
                continue;
            }

            latestDisposition[eventRecord.FindingId.Trim()] = eventRecord.Disposition.Value;
        }

        return latestDisposition;
    }

    private static Dictionary<string, FindingReviewEventRecord> BuildLatestEventByFindingId(
        IReadOnlyList<FindingReviewEventRecord> events)
    {
        Dictionary<string, FindingReviewEventRecord> latestEventByFindingId =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (FindingReviewEventRecord eventRecord in events.OrderBy(static e => e.OccurredAtUtc))
        {
            if (string.IsNullOrWhiteSpace(eventRecord.FindingId))
            {
                continue;
            }

            latestEventByFindingId[eventRecord.FindingId.Trim()] = eventRecord;
        }

        return latestEventByFindingId;
    }
}
