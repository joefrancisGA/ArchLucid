using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     AS-059: default wire values before heuristic/async overlay (AS-060 persists overlay later).
/// </summary>
public static class FindingSemanticSupportBandDefaultsApplicator
{
    public static void Apply(IReadOnlyList<Finding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        foreach (Finding finding in findings)

            if (finding.SemanticSupportBand is not null)
                continue;
            else if (finding.Classification == FindingClassification.ChecklistCoverage)
                finding.SemanticSupportBand = FindingSemanticSupportBand.NotScored;
            else
                finding.SemanticSupportBand = FindingSemanticSupportBand.Unchecked;
    }
}
