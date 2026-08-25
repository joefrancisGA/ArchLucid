using System.Text;

using ArchLucid.Application.Diffs;
using ArchLucid.Application.Findings;

namespace ArchLucid.Application.Analysis;

/// <summary>Markdown export for <see cref="EndToEndReplayComparisonReport"/>.</summary>
public static class EndToEndReplayComparisonMarkdownExportFormatter
{
    public static string Generate(
        IEndToEndReplayComparisonSummaryFormatter summaryFormatter,
        EndToEndReplayComparisonReport report,
        string? profile = null)
    {
        ArgumentNullException.ThrowIfNull(summaryFormatter);
        ArgumentNullException.ThrowIfNull(report);
        string p = EndToEndComparisonExportProfile.Normalize(profile);
        StringBuilder sb = new();
        AppendHeader(sb, report);
        sb.AppendLine(summaryFormatter.FormatMarkdown(report).Trim());
        sb.AppendLine();
        if (EndToEndComparisonExportProfile.IsShort(p))
            return sb.ToString();
        sb.AppendLine("---");
        sb.AppendLine();
        if (EndToEndComparisonExportProfile.IsExecutive(p))
            AppendSponsorReport(sb, report);
        else
        {
            AppendRunMetadataDiff(sb, report);
            AppendAgentResultDiff(sb, report);
            AppendManifestDiff(sb, report);
            AppendExportDiffs(sb, report);
            if (report.CompareQualityDelta is not null)
                CompareQualityDeltaExportFormatter.AppendMarkdown(sb, report.CompareQualityDelta);
        }

        AppendList(sb, "Interpretation Notes", report.InterpretationNotes);
        AppendList(sb, "Warnings", report.Warnings);
        return sb.ToString();
    }

    private static void AppendHeader(StringBuilder sb, EndToEndReplayComparisonReport report)
    {
        sb.AppendLine("# ArchLucid End-to-End Replay Comparison Export");
        sb.AppendLine();
        sb.AppendLine($"- Left Run ID: {report.LeftRunId}");
        sb.AppendLine($"- Right Run ID: {report.RightRunId}");
        sb.AppendLine($"- Generated UTC: {TimeProvider.System.UtcNowDateTime():O}");

        if (report.FindingCorrelation is not null)
        {
            ComparisonFindingCorrelationMetadata metadata = report.FindingCorrelation;
            sb.AppendLine($"- Finding correlation method: {metadata.PrimaryCorrelationMethod}");
            sb.AppendLine($"- Finding dedupe key format: {ComparisonFindingCorrelationMetadata.DedupeKeyFormat}");
            sb.AppendLine($"- Policy-rule matches: {metadata.PolicyRuleMatchCount}");
            sb.AppendLine($"- Fuzzy (possible) matches: {metadata.FuzzyMatchCount}");
            sb.AppendLine($"- Unmatched left findings: {metadata.UnmatchedLeftCount}");
            sb.AppendLine($"- Unmatched right findings: {metadata.UnmatchedRightCount}");
            sb.AppendLine($"- Correlation honesty: {metadata.HonestyNote}");
        }

        if (report.FindingLifecycle is not null)
            foreach (string line in CrossReviewFindingLifecycleExportLines.Build(report.FindingLifecycle))
                sb.AppendLine($"- {line}");

        sb.AppendLine();
    }

    private static void AppendSponsorReport(StringBuilder sb, EndToEndReplayComparisonReport report)
    {
        sb.AppendLine("## Key counts");
        sb.AppendLine();
        sb.AppendLine(
            $"- Run metadata: {report.RunDiff.ChangedFields.Count} changed field(s); Request IDs differ: {(report.RunDiff.RequestIdsDiffer ? "Yes" : "No")}");
        if (report.AgentResultDiff is not null)
        {
            int withChanges = report.AgentResultDiff.AgentDeltas.Count(d =>
                d.AddedClaims.Count > 0 || d.RemovedClaims.Count > 0 || d.AddedFindings.Count > 0 || d.RemovedFindings.Count > 0 ||
                d.AddedRequiredControls.Count > 0 || d.RemovedRequiredControls.Count > 0 || d.AddedWarnings.Count > 0 || d.RemovedWarnings.Count > 0);
            sb.AppendLine($"- Agent deltas: {withChanges} agent(s) with material changes");
        }

        if (report.ManifestDiff is not null)
            sb.AppendLine(
                $"- Manifest: +{report.ManifestDiff.AddedServices.Count} / -{report.ManifestDiff.RemovedServices.Count} services; +{report.ManifestDiff.AddedDatastores.Count} / -{report.ManifestDiff.RemovedDatastores.Count} datastores");
        sb.AppendLine($"- Export diffs: {report.ExportDiffs.Count}");
        sb.AppendLine();
    }

    private static void AppendRunMetadataDiff(StringBuilder sb, EndToEndReplayComparisonReport report)
    {
        sb.AppendLine("## Run Metadata Diff");
        sb.AppendLine();
        AppendList(sb, "Changed Fields", report.RunDiff.ChangedFields);
        sb.AppendLine($"- Request IDs Differ: {(report.RunDiff.RequestIdsDiffer ? "Yes" : "No")}");
        sb.AppendLine($"- Manifest Versions Differ: {(report.RunDiff.ManifestVersionsDiffer ? "Yes" : "No")}");
        sb.AppendLine($"- Status Differs: {(report.RunDiff.StatusDiffers ? "Yes" : "No")}");
        sb.AppendLine($"- Completion State Differs: {(report.RunDiff.CompletionStateDiffers ? "Yes" : "No")}");
        sb.AppendLine();
    }

    private static void AppendAgentResultDiff(StringBuilder sb, EndToEndReplayComparisonReport report)
    {
        if (report.AgentResultDiff is null)
            return;
        sb.AppendLine("## Agent Result Diff");
        sb.AppendLine();
        foreach (AgentResultDelta delta in report.AgentResultDiff.AgentDeltas.OrderBy(x => x.AgentType))
        {
            sb.AppendLine($"### {delta.AgentType}");
            sb.AppendLine();
            sb.AppendLine($"- Left Exists: {(delta.LeftExists ? "Yes" : "No")}");
            sb.AppendLine($"- Right Exists: {(delta.RightExists ? "Yes" : "No")}");
            sb.AppendLine($"- Left Confidence: {(delta.LeftConfidence.HasValue ? delta.LeftConfidence.Value.ToString("0.00") : "n/a")}");
            sb.AppendLine($"- Right Confidence: {(delta.RightConfidence.HasValue ? delta.RightConfidence.Value.ToString("0.00") : "n/a")}");
            sb.AppendLine();
            AppendList(sb, "Added Claims", delta.AddedClaims);
            AppendList(sb, "Removed Claims", delta.RemovedClaims);
            AppendList(sb, "Added Findings", delta.AddedFindings);
            AppendList(sb, "Removed Findings", delta.RemovedFindings);
            AppendList(sb, "Added Required Controls", delta.AddedRequiredControls);
            AppendList(sb, "Removed Required Controls", delta.RemovedRequiredControls);
            AppendList(sb, "Added Warnings", delta.AddedWarnings);
            AppendList(sb, "Removed Warnings", delta.RemovedWarnings);
        }
    }

    private static void AppendManifestDiff(StringBuilder sb, EndToEndReplayComparisonReport report)
    {
        if (report.ManifestDiff is null)
            return;
        sb.AppendLine("## Manifest Diff");
        sb.AppendLine();
        AppendList(sb, "Added Services", report.ManifestDiff.AddedServices);
        AppendList(sb, "Removed Services", report.ManifestDiff.RemovedServices);
        AppendList(sb, "Added Datastores", report.ManifestDiff.AddedDatastores);
        AppendList(sb, "Removed Datastores", report.ManifestDiff.RemovedDatastores);
        AppendList(sb, "Added Required Controls", report.ManifestDiff.AddedRequiredControls);
        AppendList(sb, "Removed Required Controls", report.ManifestDiff.RemovedRequiredControls);
        if (report.ManifestDiff.AddedRelationships.Count > 0)
        {
            sb.AppendLine("### Added Relationships");
            sb.AppendLine();
            foreach (RelationshipDiffItem rel in report.ManifestDiff.AddedRelationships)
                sb.AppendLine($"- {rel.SourceId} -> {rel.TargetId} ({rel.RelationshipType})");
            sb.AppendLine();
        }

        if (report.ManifestDiff.RemovedRelationships.Count <= 0)
            return;
        sb.AppendLine("### Removed Relationships");
        sb.AppendLine();
        foreach (RelationshipDiffItem rel in report.ManifestDiff.RemovedRelationships)
            sb.AppendLine($"- {rel.SourceId} -> {rel.TargetId} ({rel.RelationshipType})");
        sb.AppendLine();
    }

    private static void AppendExportDiffs(StringBuilder sb, EndToEndReplayComparisonReport report)
    {
        if (report.ExportDiffs.Count == 0)
            return;
        sb.AppendLine("## Export Diffs");
        sb.AppendLine();
        foreach (ExportRecordDiffResult diff in report.ExportDiffs)
        {
            sb.AppendLine($"### {diff.LeftExportRecordId} -> {diff.RightExportRecordId}");
            sb.AppendLine();
            AppendList(sb, "Changed Top-Level Fields", diff.ChangedTopLevelFields);
            AppendList(sb, "Changed Request Flags", diff.RequestDiff.ChangedFlags);
            AppendList(sb, "Changed Request Values", diff.RequestDiff.ChangedValues);
            AppendList(sb, "Warnings", diff.Warnings);
        }
    }

    private static void AppendList(StringBuilder sb, string title, IReadOnlyCollection<string> items)
    {
        sb.AppendLine($"### {title}");
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
}
