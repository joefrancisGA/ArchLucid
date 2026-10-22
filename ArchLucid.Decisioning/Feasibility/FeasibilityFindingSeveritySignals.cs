using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Feasibility;

/// <summary>ADR 0050 follow-up — links feasibility outcomes to accepted finding severities (TB-2229).</summary>
internal static class FeasibilityFindingSeveritySignals
{
    internal static bool HasBlockingAcceptedSeverities(
        FindingsSnapshot? findingsSnapshot,
        IReadOnlyList<string>? acceptedFindingIds)
    {
        if (findingsSnapshot is null || acceptedFindingIds is null || acceptedFindingIds.Count == 0)
            return false;

        HashSet<string> accepted = acceptedFindingIds.ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (Finding finding in findingsSnapshot.Findings)
        {
            if (!accepted.Contains(finding.FindingId))
                continue;

            if (finding.Treatment == FindingTreatment.DemoteToChecklist)
                continue;

            if (finding.Severity >= FindingSeverity.Error)
                return true;
        }

        return false;
    }

    internal static IReadOnlyList<string> CollectBlockingAcceptedFindingIds(
        FindingsSnapshot? findingsSnapshot,
        IReadOnlyList<string>? acceptedFindingIds)
    {
        if (findingsSnapshot is null || acceptedFindingIds is null || acceptedFindingIds.Count == 0)
            return [];

        HashSet<string> accepted = acceptedFindingIds.ToHashSet(StringComparer.OrdinalIgnoreCase);
        List<string> blocking = [];

        foreach (Finding finding in findingsSnapshot.Findings)
        {
            if (!accepted.Contains(finding.FindingId))
                continue;

            if (finding.Treatment == FindingTreatment.DemoteToChecklist)
                continue;

            if (finding.Severity >= FindingSeverity.Error)
                blocking.Add(finding.FindingId);
        }

        return blocking;
    }
}
