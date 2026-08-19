using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings;

/// <summary>Splits demoted insight-density candidates into checklist coverage (TB-384).</summary>
public static class FindingChecklistCoverageRouter
{
    public static void Apply(FindingsSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        List<Finding> retained = [];
        List<Finding> checklist = [];
        HashSet<string> checklistIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (Finding finding in snapshot.ChecklistCoverage)
        {
            if (checklistIds.Add(finding.FindingId))
            {
                checklist.Add(finding);
            }
        }

        foreach (Finding finding in snapshot.Findings)
        {
            if (ShouldRouteToChecklist(finding))
            {
                if (checklistIds.Add(finding.FindingId))
                {
                    checklist.Add(finding);
                }
            }
            else
            {
                retained.Add(finding);
            }
        }

        snapshot.Findings = retained;
        snapshot.ChecklistCoverage = checklist;
        snapshot.InsightDensityCuration = new InsightDensityCurationSummary
        {
            DemotedToChecklistCount = checklist.Count,
            RetainedFindingCount = retained.Count,
        };
    }

    public static bool ShouldRouteToChecklist(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.Classification == FindingClassification.ChecklistCoverage)
        {
            return true;
        }

        return finding.Treatment == FindingTreatment.DemoteToChecklist;
    }
}
