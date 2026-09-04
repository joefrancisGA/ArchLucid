using System.Text;

using ArchLucid.Application.Diffs;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Formats an <see cref="EndToEndReplayComparisonReport" /> as Markdown, listing run-metadata changes,
///     agents with material results changes, manifest structural changes, and export-record diffs.
/// </summary>
public sealed class MarkdownEndToEndReplayComparisonSummaryFormatter
    : IEndToEndReplayComparisonSummaryFormatter
{
    /// <inheritdoc />
    public string FormatMarkdown(EndToEndReplayComparisonReport report)
    {
        ArgumentNullException.ThrowIfNull(report);

        StringBuilder sb = new();

        sb.AppendLine($"# End-to-End Replay Comparison: {report.LeftRunId} -> {report.RightRunId}");
        sb.AppendLine();

        AppendSection(sb, "Run Metadata Changes", report.RunDiff.ChangedFields);

        if (report.AgentResultDiff is not null)
        {
            List<string> changedAgents = report.AgentResultDiff.AgentDeltas
                .Where(AgentResultDeltaMateriality.HasMaterialChanges)
                .Select(d => d.AgentType.ToString())
                .ToList();

            AppendSection(sb, "Agents With Material Changes", changedAgents);
        }

        if (report.ManifestDiff is not null)
        {
            AppendSection(sb, "Manifest Added Services", report.ManifestDiff.AddedServices);
            AppendSection(sb, "Manifest Removed Services", report.ManifestDiff.RemovedServices);
            AppendSection(sb, "Manifest Added Datastores", report.ManifestDiff.AddedDatastores);
            AppendSection(sb, "Manifest Removed Datastores", report.ManifestDiff.RemovedDatastores);
            AppendSection(sb, "Manifest Added Required Controls", report.ManifestDiff.AddedRequiredControls);
            AppendSection(sb, "Manifest Removed Required Controls", report.ManifestDiff.RemovedRequiredControls);
            AppendRelationshipSection(sb, "Manifest Added Relationships", report.ManifestDiff.AddedRelationships);
            AppendRelationshipSection(sb, "Manifest Removed Relationships", report.ManifestDiff.RemovedRelationships);
            AppendSection(sb, "Manifest Warnings", report.ManifestDiff.Warnings);
        }

        if (report.ExportDiffs.Count > 0)
        {
            List<string> exportChangeSummaries = report.ExportDiffs
                .Select(d => $"{d.LeftExportRecordId} -> {d.RightExportRecordId}: " +
                             $"{d.ChangedTopLevelFields.Count} top-level change(s), " +
                             $"{d.RequestDiff.ChangedFlags.Count} flag change(s), " +
                             $"{d.RequestDiff.ChangedValues.Count} value change(s)")
                .ToList();

            AppendSection(sb, "Export Diff Summary", exportChangeSummaries);
        }

        if (report.CompareQualityDelta is not null)
        {
            CompareQualityDeltaExportFormatter.AppendMarkdown(sb, report.CompareQualityDelta);
        }

        AppendSection(sb, "Interpretation Notes", report.InterpretationNotes);
        AppendSection(sb, "Warnings", report.Warnings);

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
            sb.AppendLine("- None");
            sb.AppendLine();
            return;
        }

        foreach (string item in items)

            sb.AppendLine($"- {item}");

        sb.AppendLine();
    }

    private static void AppendRelationshipSection(
        StringBuilder sb,
        string title,
        IReadOnlyCollection<RelationshipDiffItem> relationships)
    {
        if (relationships.Count == 0)
            return;

        List<string> items = relationships
            .Select(rel => $"{rel.SourceId} -> {rel.TargetId} ({rel.RelationshipType})")
            .ToList();

        AppendSection(sb, title, items);
    }
}
