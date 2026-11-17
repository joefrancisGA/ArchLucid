using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Core.InfraEvidence;

/// <summary>
/// Counts distinct cloud-resource and control pairs that recurred inside a snapshot window.
/// A pair counts when a finding in the window is Recurred, or Open after an earlier Closed finding shares the pair.
/// </summary>
public static class SecureNowOutcomeRecurrenceCounter
{
    public static int Count(
        IReadOnlyList<OperationalSecurityFindingRecord> findings,
        DateTime windowStartUtc,
        DateTime windowEndUtc)
    {
        ArgumentNullException.ThrowIfNull(findings);

        List<OperationalSecurityFindingRecord> scoped = findings
            .Where(finding =>
                finding.CloudResourceId is not null
                && finding.CloudResourceId != Guid.Empty
                && !string.IsNullOrWhiteSpace(finding.ControlId))
            .ToList();

        Dictionary<(Guid CloudResourceId, string ControlId), DateTime> firstClosedUpdateByPair = scoped
            .Where(finding => finding.Status == OperationalSecurityFindingStatus.Closed)
            .GroupBy(finding => (finding.CloudResourceId!.Value, finding.ControlId!))
            .ToDictionary(group => group.Key, group => group.Min(finding => finding.UpdatedUtc));

        HashSet<(Guid CloudResourceId, string ControlId)> recurrencePairs = [];

        foreach (OperationalSecurityFindingRecord finding in scoped)
        {
            if (finding.UpdatedUtc <= windowStartUtc || finding.UpdatedUtc > windowEndUtc)
            {
                continue;
            }

            (Guid CloudResourceId, string ControlId) pair =
                (finding.CloudResourceId!.Value, finding.ControlId!);

            if (finding.Status == OperationalSecurityFindingStatus.Recurred)
            {
                recurrencePairs.Add(pair);
                continue;
            }

            if (finding.Status == OperationalSecurityFindingStatus.Open
                && firstClosedUpdateByPair.TryGetValue(pair, out DateTime firstClosedUpdateUtc)
                && firstClosedUpdateUtc < finding.UpdatedUtc)
            {
                recurrencePairs.Add(pair);
            }
        }

        return recurrencePairs.Count;
    }
}
