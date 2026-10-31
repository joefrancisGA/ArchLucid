using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Keeps merge-conflict triage rows on the decision-visible findings list.
///     Density/provenance gates treat empty RelatedNodeIds as a Kind A hold; those rows are
///     not architecture findings, so demotion would hide the operator resolve surface.
/// </summary>
internal static class FindingMergeConflictTriageRetention
{
    public static void Apply(IReadOnlyList<Finding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        foreach (Finding finding in findings.Where(IsMergeConflictRow))
        {
            finding.Classification = FindingClassification.DecisionGradeFinding;
            finding.Treatment = FindingTreatment.Promote;
        }
    }

    private static bool IsMergeConflictRow(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        return string.Equals(
            finding.FindingType,
            FindingMergeConflictPresenter.FindingType,
            StringComparison.Ordinal);
    }
}
