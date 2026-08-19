using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings;

/// <summary>Splits demoted agent findings into checklist coverage on <see cref="AgentResult" /> (TB-384).</summary>
public static class ArchitectureFindingChecklistCoverageRouter
{
    public static void Apply(AgentResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        List<ArchitectureFinding> retained = [];
        List<ArchitectureFinding> checklist = [];
        HashSet<string> checklistIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (ArchitectureFinding finding in result.ChecklistCoverage)
        {
            if (checklistIds.Add(finding.FindingId))
            {
                checklist.Add(finding);
            }
        }

        foreach (ArchitectureFinding finding in result.Findings)
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

        result.Findings = retained;
        result.ChecklistCoverage = checklist;
        result.InsightDensityCuration = new InsightDensityCurationSummary
        {
            DemotedToChecklistCount = checklist.Count,
            RetainedFindingCount = retained.Count,
        };
    }

    private static bool ShouldRouteToChecklist(ArchitectureFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.Classification == FindingClassification.ChecklistCoverage)
        {
            return true;
        }

        return finding.Treatment == FindingTreatment.DemoteToChecklist;
    }
}
