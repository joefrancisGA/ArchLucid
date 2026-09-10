using System.Text;

using ArchLucid.Application.Findings;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Application.Exports;

/// <summary>
///     AS-071: semantic support band stamp for career markdown exports (mirrors
///     <c>finding-semantic-support-band-export.ts</c>).
/// </summary>
public static class CareerExportSemanticSupportBandMarkdownFormatter
{
    public static string FormatMarkdown(IReadOnlyList<Finding>? findings)
    {
        if (findings is not { Count: > 0 })
        {
            return string.Empty;
        }

        FirstValueReportSemanticSupportBandSummary.SemanticSupportBandStampCounts counts =
            CountDecisionGradeSemanticSupportBands(findings);
        string? stampLine = FirstValueReportSemanticSupportBandSummary.FormatStampSemanticSupportBandLine(counts);

        if (stampLine is null)
        {
            return string.Empty;
        }

        StringBuilder sb = new();
        sb.AppendLine("## Semantic support");
        sb.AppendLine();
        sb.AppendLine(
            $"Scorer version: `{FindingSemanticSupportBandScorerVersions.As057QuoteOverlapV1}`.");
        sb.AppendLine(stampLine);
        sb.AppendLine();

        return sb.ToString();
    }

    private static FirstValueReportSemanticSupportBandSummary.SemanticSupportBandStampCounts
        CountDecisionGradeSemanticSupportBands(IReadOnlyList<Finding> findings)
    {
        int supported = 0;
        int uncheckedCount = 0;
        int unsupported = 0;
        int notScored = 0;
        int decisionGradeTotal = 0;

        foreach (Finding finding in findings)
        {
            if (!DecisionGradeFindingExportFilter.IsDecisionGradeForExport(finding))
            {
                continue;
            }

            decisionGradeTotal++;
            FindingSemanticSupportBand band =
                FirstValueReportSemanticSupportBandSummary.ResolveDecisionGradeSemanticSupportBand(
                    finding.SemanticSupportBand);

            switch (band)
            {
                case FindingSemanticSupportBand.Supported:
                    supported++;
                    break;
                case FindingSemanticSupportBand.Unchecked:
                    uncheckedCount++;
                    break;
                case FindingSemanticSupportBand.Unsupported:
                    unsupported++;
                    break;
                default:
                    notScored++;
                    break;
            }
        }

        return new FirstValueReportSemanticSupportBandSummary.SemanticSupportBandStampCounts(
            supported,
            uncheckedCount,
            unsupported,
            notScored,
            decisionGradeTotal);
    }
}
