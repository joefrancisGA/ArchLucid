using System.Net;
using System.Text;

using ArchLucid.Application.Exports;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Shared labels for compare verdict chrome exports (aligned with UI compare-two-reviews panels).
/// </summary>
internal static class CompareVerdictChromeExportFormatter
{
    private const string CombinedHeading = "## Compare Verdict Chrome Delta";

    internal static void AppendMarkdown(StringBuilder sb, CompareVerdictChromeDelta delta)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(delta);

        if (!delta.HasAnySection)
        {
            return;
        }

        sb.AppendLine(CombinedHeading);
        sb.AppendLine();

        if (delta.GateOutcome is not null)
        {
            AppendSideBySideMarkdown(
                sb,
                "Pre-commit gate outcome",
                delta.GateOutcome.BaselineGateLabel,
                delta.GateOutcome.TargetGateLabel);
        }

        if (delta.PackAssignment is not null)
        {
            AppendSideBySideMarkdown(
                sb,
                "Pack assignment",
                delta.PackAssignment.BaselineSummaryLine,
                delta.PackAssignment.TargetSummaryLine);
        }

        if (delta.ExecutionMode is not null)
        {
            AppendSideBySideMarkdown(
                sb,
                "Execution mode",
                delta.ExecutionMode.BaselineModeLabel,
                delta.ExecutionMode.TargetModeLabel);

            if (!string.IsNullOrWhiteSpace(delta.ExecutionMode.AdvisoryParagraph))
            {
                sb.AppendLine($"_{delta.ExecutionMode.AdvisoryParagraph}_");
                sb.AppendLine();
            }
        }

        if (delta.RoiHeadline is not null)
        {
            AppendSideBySideMarkdown(
                sb,
                "Run-level estimated savings (USD)",
                delta.RoiHeadline.BaselineSavingsLabel ?? "—",
                delta.RoiHeadline.TargetSavingsLabel ?? "—");
        }

        sb.AppendLine($"**Policy influence:** {delta.Wk21Line}");
        sb.AppendLine();
        sb.AppendLine($"**Sponsor ROI honesty:** {delta.NonSummingLine}");
        sb.AppendLine();
    }

    internal static void AppendHtml(StringBuilder sb, CompareVerdictChromeDelta delta)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(delta);

        if (!delta.HasAnySection)
        {
            return;
        }

        sb.AppendLine("<h2>Compare Verdict Chrome Delta</h2><ul>");

        if (delta.GateOutcome is not null)
        {
            AppendSideBySideHtml(
                sb,
                "Pre-commit gate outcome",
                delta.GateOutcome.BaselineGateLabel,
                delta.GateOutcome.TargetGateLabel);
        }

        if (delta.PackAssignment is not null)
        {
            AppendSideBySideHtml(
                sb,
                "Pack assignment",
                delta.PackAssignment.BaselineSummaryLine,
                delta.PackAssignment.TargetSummaryLine);
        }

        if (delta.ExecutionMode is not null)
        {
            AppendSideBySideHtml(
                sb,
                "Execution mode",
                delta.ExecutionMode.BaselineModeLabel,
                delta.ExecutionMode.TargetModeLabel);

            if (!string.IsNullOrWhiteSpace(delta.ExecutionMode.AdvisoryParagraph))
            {
                sb.AppendLine("<li><em>" + WebUtility.HtmlEncode(delta.ExecutionMode.AdvisoryParagraph) + "</em></li>");
            }
        }

        if (delta.RoiHeadline is not null)
        {
            AppendSideBySideHtml(
                sb,
                "Run-level estimated savings (USD)",
                delta.RoiHeadline.BaselineSavingsLabel ?? "—",
                delta.RoiHeadline.TargetSavingsLabel ?? "—");
        }

        sb.AppendLine(
            "<li>Policy influence: "
            + WebUtility.HtmlEncode(delta.Wk21Line)
            + "</li>");
        sb.AppendLine(
            "<li>Sponsor ROI honesty: "
            + WebUtility.HtmlEncode(delta.NonSummingLine)
            + "</li>");
        sb.AppendLine("</ul>");
    }

    internal static IReadOnlyList<string> BuildPlainTextLines(CompareVerdictChromeDelta delta)
    {
        ArgumentNullException.ThrowIfNull(delta);

        if (!delta.HasAnySection)
        {
            return [];
        }

        List<string> lines = ["Compare Verdict Chrome Delta:"];

        if (delta.GateOutcome is not null)
        {
            lines.Add(
                $"Pre-commit gate outcome — baseline: {delta.GateOutcome.BaselineGateLabel}, updated: {delta.GateOutcome.TargetGateLabel}");
        }

        if (delta.PackAssignment is not null)
        {
            lines.Add(
                $"Pack assignment — baseline: {delta.PackAssignment.BaselineSummaryLine}, updated: {delta.PackAssignment.TargetSummaryLine}");
        }

        if (delta.ExecutionMode is not null)
        {
            lines.Add(
                $"Execution mode — baseline: {delta.ExecutionMode.BaselineModeLabel}, updated: {delta.ExecutionMode.TargetModeLabel}");

            if (!string.IsNullOrWhiteSpace(delta.ExecutionMode.AdvisoryParagraph))
            {
                lines.Add(delta.ExecutionMode.AdvisoryParagraph);
            }
        }

        if (delta.RoiHeadline is not null)
        {
            lines.Add(
                $"Run-level estimated savings — baseline: {delta.RoiHeadline.BaselineSavingsLabel ?? "—"}, updated: {delta.RoiHeadline.TargetSavingsLabel ?? "—"}");
        }

        lines.Add($"Policy influence: {delta.Wk21Line}");
        lines.Add($"Sponsor ROI honesty: {delta.NonSummingLine}");

        return lines;
    }

    internal static string RemoveMarkdownSection(string markdown)
    {
        const string heading = CombinedHeading;
        int start = markdown.IndexOf(heading, StringComparison.Ordinal);

        if (start < 0)
        {
            return markdown;
        }

        int nextSection = markdown.IndexOf("\n## ", start + heading.Length, StringComparison.Ordinal);

        if (nextSection < 0)
        {
            return markdown[..start].TrimEnd();
        }

        return (markdown[..start] + markdown[nextSection..]).Trim();
    }

    private static void AppendSideBySideMarkdown(
        StringBuilder sb,
        string title,
        string baselineValue,
        string targetValue)
    {
        sb.AppendLine($"### {title}");
        sb.AppendLine();
        sb.AppendLine("| Side | Value |");
        sb.AppendLine("| --- | --- |");
        sb.AppendLine($"| Baseline review | {baselineValue} |");
        sb.AppendLine($"| Updated review | {targetValue} |");
        sb.AppendLine();
    }

    private static void AppendSideBySideHtml(
        StringBuilder sb,
        string title,
        string baselineValue,
        string targetValue)
    {
        sb.AppendLine(
            "<li>"
            + WebUtility.HtmlEncode(title)
            + ": baseline "
            + WebUtility.HtmlEncode(baselineValue)
            + ", updated "
            + WebUtility.HtmlEncode(targetValue)
            + "</li>");
    }
}
