using ArchLucid.Application.Diffs;
using ArchLucid.Application.Rendering;

using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ArchLucid.Application.Analysis;

/// <summary>PDF export for <see cref="EndToEndReplayComparisonReport"/>.</summary>
public static class EndToEndReplayComparisonPdfExportFormatter
{
    public static Task<byte[]> GenerateAsync(
        IEndToEndReplayComparisonSummaryFormatter summaryFormatter,
        EndToEndReplayComparisonReport report,
        CancellationToken cancellationToken = default,
        string? profile = null)
    {
        ArgumentNullException.ThrowIfNull(summaryFormatter);
        ArgumentNullException.ThrowIfNull(report);
        cancellationToken.ThrowIfCancellationRequested();
        string p = EndToEndComparisonExportProfile.Normalize(profile);
        string summaryMarkdown = summaryFormatter.FormatMarkdown(report).Trim();

        if (report.CompareQualityDelta is not null)
            summaryMarkdown = CompareQualityDeltaExportFormatter.RemoveMarkdownSection(summaryMarkdown);

        byte[] pdf = QuestPdfDocumentBytes.Generate(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Helvetica"));
                page.Header().Text("ArchLucid End-to-End Replay Comparison").Bold().FontSize(14);
                page.Content().Column(column =>
                {
                    column.Item().PaddingBottom(5).Text($"Left: {report.LeftRunId}  |  Right: {report.RightRunId}  |  Profile: {p}");
                    column.Item().PaddingBottom(10).Text($"Generated: {TimeProvider.System.UtcNowDateTime():O}");
                    column.Item().PaddingBottom(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                    column.Item().PaddingBottom(5).Text("Summary").Bold().FontSize(12);
                    column.Item().PaddingBottom(10).Text(summaryMarkdown);

                    if (report.CompareQualityDelta is not null)
                        AppendCompareQualityDelta(column, report.CompareQualityDelta);

                    if (!EndToEndComparisonExportProfile.IsShort(p))
                    {
                        if (EndToEndComparisonExportProfile.IsExecutive(p))
                            AppendSponsorReport(column, report);
                        else
                        {
                            AppendRunMetadataDiff(column, report);
                            AppendAgentResultDiff(column, report);
                            AppendManifestDiff(column, report);
                            AppendExportDiffs(column, report);
                        }

                        if (!summaryMarkdown.Contains("## Interpretation Notes", StringComparison.Ordinal))
                            AppendList(column, "Interpretation Notes", report.InterpretationNotes);

                        if (!summaryMarkdown.Contains("## Warnings", StringComparison.Ordinal))
                            AppendList(column, "Warnings", report.Warnings);
                    }
                });
            });
        });

        return Task.FromResult(pdf);
    }

    private static void AppendSponsorReport(ColumnDescriptor column, EndToEndReplayComparisonReport report)
    {
        column.Item().PaddingTop(5).Text("Key counts").Bold().FontSize(12);
        column.Item().Text(
            $"Run metadata: {report.RunDiff.ChangedFields.Count} changed field(s); Request IDs differ: {(report.RunDiff.RequestIdsDiffer ? "Yes" : "No")}");

        if (report.AgentResultDiff is not null)
        {
            int withChanges = AgentResultDeltaMateriality.CountWithMaterialChanges(report.AgentResultDiff.AgentDeltas);
            column.Item().Text($"Agent deltas: {withChanges} agent(s) with material changes");
        }

        if (report.ManifestDiff is not null)
            column.Item().Text(
                $"Manifest: +{report.ManifestDiff.AddedServices.Count} / -{report.ManifestDiff.RemovedServices.Count} services; +{report.ManifestDiff.AddedDatastores.Count} / -{report.ManifestDiff.RemovedDatastores.Count} datastores; +{report.ManifestDiff.AddedRelationships.Count} / -{report.ManifestDiff.RemovedRelationships.Count} relationships");

        column.Item().Text($"Export diffs: {report.ExportDiffs.Count}");
    }

    private static void AppendRunMetadataDiff(ColumnDescriptor column, EndToEndReplayComparisonReport report)
    {
        column.Item().PaddingTop(5).Text("Run Metadata Diff").Bold().FontSize(12);
        column.Item().Text($"Request IDs Differ: {(report.RunDiff.RequestIdsDiffer ? "Yes" : "No")}");
        column.Item().Text($"Manifest Versions Differ: {(report.RunDiff.ManifestVersionsDiffer ? "Yes" : "No")}");
        column.Item().Text($"Status Differs: {(report.RunDiff.StatusDiffers ? "Yes" : "No")}");
        column.Item().Text($"Completion State Differs: {(report.RunDiff.CompletionStateDiffers ? "Yes" : "No")}");

        foreach (string field in report.RunDiff.ChangedFields)
            column.Item().Text($"Changed Field: {field}");
    }

    private static void AppendAgentResultDiff(ColumnDescriptor column, EndToEndReplayComparisonReport report)
    {
        if (report.AgentResultDiff is null)
            return;

        column.Item().PaddingTop(5).Text("Agent Result Diff").Bold().FontSize(12);

        foreach (AgentResultDelta delta in report.AgentResultDiff.AgentDeltas.OrderBy(x => x.AgentType))
        {
            column.Item().PaddingTop(3).Text(delta.AgentType.ToString()).Bold();
            column.Item().Text($"Left Exists: {(delta.LeftExists ? "Yes" : "No")}");
            column.Item().Text($"Right Exists: {(delta.RightExists ? "Yes" : "No")}");
            column.Item().Text($"Left Confidence: {(delta.LeftConfidence.HasValue ? delta.LeftConfidence.Value.ToString("0.00") : "n/a")}");
            column.Item().Text($"Right Confidence: {(delta.RightConfidence.HasValue ? delta.RightConfidence.Value.ToString("0.00") : "n/a")}");
            AppendDiffSection(column, "Added Claims", delta.AddedClaims);
            AppendDiffSection(column, "Removed Claims", delta.RemovedClaims);
            AppendDiffSection(column, "Added Findings", delta.AddedFindings);
            AppendDiffSection(column, "Removed Findings", delta.RemovedFindings);
            AppendDiffSection(column, "Added Required Controls", delta.AddedRequiredControls);
            AppendDiffSection(column, "Removed Required Controls", delta.RemovedRequiredControls);
            AppendDiffSection(column, "Added Warnings", delta.AddedWarnings);
            AppendDiffSection(column, "Removed Warnings", delta.RemovedWarnings);
            AppendDiffSection(column, "Added Evidence References", delta.AddedEvidenceRefs);
            AppendDiffSection(column, "Removed Evidence References", delta.RemovedEvidenceRefs);
        }
    }

    private static void AppendManifestDiff(ColumnDescriptor column, EndToEndReplayComparisonReport report)
    {
        if (report.ManifestDiff is null)
            return;

        column.Item().PaddingTop(5).Text("Manifest Diff").Bold().FontSize(12);
        AppendDiffSection(column, "Added Services", report.ManifestDiff.AddedServices);
        AppendDiffSection(column, "Removed Services", report.ManifestDiff.RemovedServices);
        AppendDiffSection(column, "Added Datastores", report.ManifestDiff.AddedDatastores);
        AppendDiffSection(column, "Removed Datastores", report.ManifestDiff.RemovedDatastores);
        AppendDiffSection(column, "Added Required Controls", report.ManifestDiff.AddedRequiredControls);
        AppendDiffSection(column, "Removed Required Controls", report.ManifestDiff.RemovedRequiredControls);
        AppendRelationshipDiffSection(column, "Added Relationships", report.ManifestDiff.AddedRelationships);
        AppendRelationshipDiffSection(column, "Removed Relationships", report.ManifestDiff.RemovedRelationships);
        AppendDiffSection(column, "Warnings", report.ManifestDiff.Warnings);
    }

    private static void AppendExportDiffs(ColumnDescriptor column, EndToEndReplayComparisonReport report)
    {
        if (report.ExportDiffs.Count == 0)
            return;

        column.Item().PaddingTop(5).Text("Export Diffs").Bold().FontSize(12);

        foreach (ExportRecordDiffResult diff in report.ExportDiffs)
        {
            column.Item().PaddingTop(3).Text($"{diff.LeftExportRecordId} -> {diff.RightExportRecordId}").Bold();
            AppendDiffSection(column, "Changed Top-Level Fields", diff.ChangedTopLevelFields);
            AppendDiffSection(column, "Changed Request Flags", diff.RequestDiff.ChangedFlags);
            AppendDiffSection(column, "Changed Request Values", diff.RequestDiff.ChangedValues);
            AppendDiffSection(column, "Warnings", diff.Warnings);
        }
    }

    private static void AppendList(ColumnDescriptor column, string title, IReadOnlyCollection<string> items)
    {
        column.Item().PaddingTop(5).Text(title).Bold().FontSize(12);

        if (items.Count == 0)
        {
            column.Item().Text("None");
            return;
        }

        foreach (string item in items)
            column.Item().Text($"• {item}");
    }

    private static void AppendDiffSection(ColumnDescriptor column, string title, IReadOnlyCollection<string> items)
    {
        column.Item().PaddingTop(2).Text(title).Bold();
        if (items.Count == 0)
        {
            column.Item().Text("None");
            return;
        }

        foreach (string item in items)
            column.Item().Text($"• {item}");
    }

    private static void AppendRelationshipDiffSection(
        ColumnDescriptor column,
        string title,
        IReadOnlyCollection<RelationshipDiffItem> relationships)
    {
        column.Item().PaddingTop(2).Text(title).Bold();

        if (relationships.Count == 0)
        {
            column.Item().Text("None");
            return;
        }

        foreach (RelationshipDiffItem relationship in relationships)
            column.Item().Text($"• {relationship.ToDisplayLine()}");
    }

    private static void AppendCompareQualityDelta(ColumnDescriptor column, CompareQualityDeltaCounts delta)
    {
        AppendList(column, "Compare Quality Delta", CompareQualityDeltaExportFormatter.BuildPlainTextLines(delta));
    }
}
