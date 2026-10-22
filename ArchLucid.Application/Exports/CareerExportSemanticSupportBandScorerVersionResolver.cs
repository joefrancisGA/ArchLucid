using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Application.Exports;

/// <summary>
///     LY-018 / LY-076: career export stamp prefers overlay scorer version when present.
///     Heuristic default remains <see cref="FindingSemanticSupportBandScorerVersions.As057QuoteOverlapV1"/>.
/// </summary>
public static class CareerExportSemanticSupportBandScorerVersionResolver
{
    public static string ResolveForFinding(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (!string.IsNullOrWhiteSpace(finding.SemanticSupportBandScorerVersion))
            return finding.SemanticSupportBandScorerVersion.Trim();

        return FindingSemanticSupportBandScorerVersions.As057QuoteOverlapV1;
    }

    public static string ResolveStampVersion(IReadOnlyList<Finding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        string? overlay = null;

        foreach (Finding finding in findings)
        {
            if (!DecisionGradeFindingExportFilter.IsDecisionGradeForExport(finding))
                continue;

            if (string.IsNullOrWhiteSpace(finding.SemanticSupportBandScorerVersion))
                continue;

            string version = finding.SemanticSupportBandScorerVersion.Trim();

            if (string.Equals(
                    version,
                    FindingSemanticSupportBandScorerVersions.As099LlmFinalizeV1,
                    StringComparison.Ordinal))
            {
                return FindingSemanticSupportBandScorerVersions.As099LlmFinalizeV1;
            }

            overlay ??= version;
        }

        return overlay ?? FindingSemanticSupportBandScorerVersions.As057QuoteOverlapV1;
    }
}
