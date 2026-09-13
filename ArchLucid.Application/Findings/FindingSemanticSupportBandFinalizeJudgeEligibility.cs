using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>
///     LY-014 inventory: Real finalize judges Unchecked (or null-band) decision-grade rows with citations.
///     Checklist coverage and empty refs stay out of the Premium pass.
/// </summary>
public static class FindingSemanticSupportBandFinalizeJudgeEligibility
{
    public static bool ShouldJudge(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (!DecisionGradeFindingExportFilter.IsDecisionGradeForExport(finding))
            return false;

        if (finding.EvidenceRefs is null || finding.EvidenceRefs.Count == 0)
            return false;

        bool hasCitation = finding.EvidenceRefs.Exists(static reference => !string.IsNullOrWhiteSpace(reference));

        if (!hasCitation)
            return false;

        return finding.SemanticSupportBand is null
            || finding.SemanticSupportBand == FindingSemanticSupportBand.Unchecked;
    }
}
