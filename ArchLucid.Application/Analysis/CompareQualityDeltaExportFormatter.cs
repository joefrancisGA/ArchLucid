using System.Net;
using System.Text;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Shared labels and row layout for compare quality delta exports (aligned with UI
///     <c>compare-quality-delta.ts</c>).
/// </summary>
internal static class CompareQualityDeltaExportFormatter
{
    internal static IReadOnlyList<CompareQualityDeltaExportRow> BuildRows(CompareQualityDeltaCounts delta)
    {
        ArgumentNullException.ThrowIfNull(delta);

        return
        [
            new CompareQualityDeltaExportRow(
                "Unsupported assumptions",
                delta.UnsupportedAssumptionsBefore,
                delta.UnsupportedAssumptionsAfter),
            new CompareQualityDeltaExportRow(
                "High-severity findings",
                delta.HighSeverityBefore,
                delta.HighSeverityAfter),
            new CompareQualityDeltaExportRow(
                "Uncovered mandatory requirements",
                delta.UncoveredMandatoryBefore,
                delta.UncoveredMandatoryAfter),
            new CompareQualityDeltaExportRow(
                "Evidence-backed decisions",
                delta.EvidenceBackedDecisionsBefore,
                delta.EvidenceBackedDecisionsAfter),
        ];
    }

    internal static void AppendMarkdown(StringBuilder sb, CompareQualityDeltaCounts delta)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(delta);

        sb.AppendLine("## Compare Quality Delta");
        sb.AppendLine();
        sb.AppendLine("| Metric | Before | After |");
        sb.AppendLine("| --- | --- | --- |");

        foreach (CompareQualityDeltaExportRow row in BuildRows(delta))
        {
            sb.AppendLine($"| {row.Label} | {row.Before} | {row.After} |");
        }

        sb.AppendLine();
    }

    internal static void AppendHtml(StringBuilder sb, CompareQualityDeltaCounts delta)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(delta);

        sb.AppendLine("<h2>Compare Quality Delta</h2><ul>");

        foreach (CompareQualityDeltaExportRow row in BuildRows(delta))
        {
            sb.AppendLine(
                "<li>" + WebUtility.HtmlEncode(row.Label) + ": before " + row.Before + ", after " + row.After + "</li>");
        }

        sb.AppendLine("</ul>");
    }

    internal sealed record CompareQualityDeltaExportRow(string Label, int Before, int After);
}
