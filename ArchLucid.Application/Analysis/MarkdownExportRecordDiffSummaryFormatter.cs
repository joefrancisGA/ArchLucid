using System.Text;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Formats an <see cref="ExportRecordDiffResult" /> as Markdown, reporting changed top-level
///     export fields, changed request flags, changed request values, and any warnings.
/// </summary>
public sealed class MarkdownExportRecordDiffSummaryFormatter : IExportRecordDiffSummaryFormatter
{
    /// <inheritdoc />
    public string FormatMarkdown(ExportRecordDiffResult diff)
    {
        ArgumentNullException.ThrowIfNull(diff);
        ExportRecordDiffResultNormalizer.NormalizeDisplayAnchors(diff);

        StringBuilder sb = new();

        string leftExportRecordId = string.IsNullOrWhiteSpace(diff.LeftExportRecordId)
            ? ArchitectureEvidenceRequestExport.LeftExportRecordIdNotStoredCopy
            : diff.LeftExportRecordId.Trim();
        string rightExportRecordId = string.IsNullOrWhiteSpace(diff.RightExportRecordId)
            ? ArchitectureEvidenceRequestExport.RightExportRecordIdNotStoredCopy
            : diff.RightExportRecordId.Trim();
        sb.AppendLine($"# Export Record Comparison: {leftExportRecordId} -> {rightExportRecordId}");
        sb.AppendLine();
        sb.AppendLine(
            $"- Left Run ID: {(string.IsNullOrWhiteSpace(diff.LeftRunId) ? ArchitectureEvidenceRequestExport.LeftRunIdNotStoredCopy : diff.LeftRunId.Trim())}");
        sb.AppendLine(
            $"- Right Run ID: {(string.IsNullOrWhiteSpace(diff.RightRunId) ? ArchitectureEvidenceRequestExport.RightRunIdNotStoredCopy : diff.RightRunId.Trim())}");
        sb.AppendLine();

        AppendSection(sb, "Changed Top-Level Fields", diff.ChangedTopLevelFields);
        AppendSection(sb, "Changed Request Flags", diff.RequestDiff.ChangedFlags);
        AppendSection(sb, "Changed Request Values", diff.RequestDiff.ChangedValues);

        if (diff.Warnings.Count > 0)

            AppendSection(sb, "Warnings", diff.Warnings);

        return sb.ToString();
    }

    private static void AppendSection(
        StringBuilder sb,
        string title,
        IReadOnlyCollection<string> items)
    {
        sb.AppendLine($"## {title}");
        sb.AppendLine();

        if (items.Count == 0)
        {
            sb.AppendLine($"- {ArchitectureEvidenceRequestExport.EmptyDiffListBulletCopy}");
            sb.AppendLine();
            return;
        }

        foreach (string item in items.OrderBy(x => x))

            sb.AppendLine($"- {item}");

        sb.AppendLine();
    }
}
