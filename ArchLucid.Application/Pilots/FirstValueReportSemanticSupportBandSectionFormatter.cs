using System.Text;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Pilots;

/// <summary>AS-063: sponsor-visible semantic support band summary for first-value report / PDF.</summary>
public static class FirstValueReportSemanticSupportBandSectionFormatter
{
    public const string SectionHeading = "## Semantic support (decision-grade)";

    public static void AppendMarkdownSection(
        StringBuilder sb,
        ArchitectureRunDetail detail,
        PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentNullException.ThrowIfNull(deltas);

        IReadOnlyList<ArchitectureFinding> materialFindings =
            PilotSponsorMaterialFindingsResolver.Resolve(detail, deltas);

        FirstValueReportSemanticSupportBandSummary.SemanticSupportBandStampCounts counts =
            FirstValueReportSemanticSupportBandSummary.CountDecisionGradeSemanticSupportBands(materialFindings);

        string? line = FirstValueReportSemanticSupportBandSummary.FormatStampSemanticSupportBandLine(counts);

        if (line is null)
        {
            return;
        }

        sb.AppendLine(SectionHeading);
        sb.AppendLine();
        sb.AppendLine(
            "Heuristic semantic support bands for decision-grade findings. Unsupported rows remain visible on sponsor artifacts — do not forward a clean PDF when citations do not support the claim.");
        sb.AppendLine();
        sb.AppendLine($"**Summary:** {line}");

        if (FirstValueReportSemanticSupportBandSummary.StampSemanticSupportShowsAllClear(counts))
        {
            sb.AppendLine();
            sb.AppendLine("No unsupported decision-grade findings on this sponsor artifact.");
        }

        IReadOnlyList<FirstValueReportSemanticSupportBandSummary.UnsupportedSemanticSupportStampEntry> unsupportedEntries =
            FirstValueReportSemanticSupportBandSummary.ListUnsupportedDecisionGradeSemanticSupportFindings(materialFindings);

        if (unsupportedEntries.Count > 0)
        {
            sb.AppendLine();
            sb.AppendLine("**Unsupported decision-grade findings:**");

            foreach (string label in FirstValueReportSemanticSupportBandSummary.FormatStampUnsupportedSemanticSupportLabels(
                         unsupportedEntries))
            {
                sb.AppendLine($"- {FirstValueReportMarkdownFormatting.EscapeMarkdownTableCell(label)}");
            }
        }

        sb.AppendLine();
    }

    public static string FormatSponsorStatusTableCell(
        ArchitectureRunDetail detail,
        PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentNullException.ThrowIfNull(deltas);

        IReadOnlyList<ArchitectureFinding> materialFindings =
            PilotSponsorMaterialFindingsResolver.Resolve(detail, deltas);

        FirstValueReportSemanticSupportBandSummary.SemanticSupportBandStampCounts counts =
            FirstValueReportSemanticSupportBandSummary.CountDecisionGradeSemanticSupportBands(materialFindings);

        string? line = FirstValueReportSemanticSupportBandSummary.FormatStampSemanticSupportBandLine(counts, compact: true);

        if (line is null)
        {
            return "No decision-grade findings to score.";
        }

        if (counts.Unsupported > 0)
        {
            IReadOnlyList<string> unsupportedLabels =
                FirstValueReportSemanticSupportBandSummary.FormatStampUnsupportedSemanticSupportLabels(
                    FirstValueReportSemanticSupportBandSummary.ListUnsupportedDecisionGradeSemanticSupportFindings(
                        materialFindings));

            string list = string.Join("<br />", unsupportedLabels.Select(FirstValueReportMarkdownFormatting.EscapeMarkdownTableCell));
            return $"**{line}** — review unsupported rows before sponsor send:<br />{list}";
        }

        return $"**{line}** — no unsupported decision-grade findings.";
    }
}
