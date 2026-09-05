using ArchLucid.Application.Diffs;

using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

using WpDocument = DocumentFormat.OpenXml.Wordprocessing.Document;

namespace ArchLucid.Application.Analysis;

/// <summary>DOCX export for <see cref="EndToEndReplayComparisonReport"/>.</summary>
public static class EndToEndReplayComparisonDocxExportFormatter
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

        using MemoryStream stream = new();
        using (WordprocessingDocument document = WordprocessingDocument.Create(stream, WordprocessingDocumentType.Document, true))
        {
            MainDocumentPart mainPart = document.AddMainDocumentPart();
            mainPart.Document = new WpDocument(new Body());
            Body body = mainPart.Document.Body!;
            AddHeading(body, "ArchLucid End-to-End Replay Comparison", 1);
            AddParagraph(body, $"Left Run ID: {report.LeftRunId}");
            AddParagraph(body, $"Right Run ID: {report.RightRunId}");
            AddParagraph(body, $"Generated UTC: {TimeProvider.System.UtcNowDateTime():O}");
            AddParagraph(body, $"Profile: {p}");
            AddSpacer(body);
            if (EndToEndComparisonExportProfile.IsShort(p))
            {
                AddHeading(body, "Summary", 2);
                AddParagraph(body, summaryMarkdown);
                AppendCompareQualityDelta(body, report);
            }
            else if (EndToEndComparisonExportProfile.IsExecutive(p))
            {
                AddHeading(body, "Summary", 2);
                AddParagraph(body, summaryMarkdown);
                AppendCompareQualityDelta(body, report);
                AddSpacer(body);
                AppendSponsorReport(body, report);
            }
            else
            {
                AddHeading(body, "Summary", 2);
                AddParagraph(body, summaryMarkdown);
                AppendCompareQualityDelta(body, report);
                AddSpacer(body);
                AddHeading(body, "Run Metadata Diff", 2);
                AddBullet(body, $"Request IDs Differ: {(report.RunDiff.RequestIdsDiffer ? "Yes" : "No")}");
                AddBullet(body, $"Manifest Versions Differ: {(report.RunDiff.ManifestVersionsDiffer ? "Yes" : "No")}");
                AddBullet(body, $"Status Differs: {(report.RunDiff.StatusDiffers ? "Yes" : "No")}");
                AddBullet(body, $"Completion State Differs: {(report.RunDiff.CompletionStateDiffers ? "Yes" : "No")}");
                foreach (string field in report.RunDiff.ChangedFields)
                    AddBullet(body, $"Changed Field: {field}");
                AddSpacer(body);
                if (report.AgentResultDiff is not null)
                {
                    AddHeading(body, "Agent Result Diff", 2);
                    foreach (AgentResultDelta delta in report.AgentResultDiff.AgentDeltas.OrderBy(x => x.AgentType))
                    {
                        AddParagraph(body, delta.AgentType.ToString(), true);
                        AddBullet(body, $"Left Exists: {(delta.LeftExists ? "Yes" : "No")}");
                        AddBullet(body, $"Right Exists: {(delta.RightExists ? "Yes" : "No")}");
                        AddBullet(body, $"Left Confidence: {(delta.LeftConfidence.HasValue ? delta.LeftConfidence.Value.ToString("0.00") : "n/a")}");
                        AddBullet(body, $"Right Confidence: {(delta.RightConfidence.HasValue ? delta.RightConfidence.Value.ToString("0.00") : "n/a")}");
                        AddDiffSection(body, "Added Claims", delta.AddedClaims);
                        AddDiffSection(body, "Removed Claims", delta.RemovedClaims);
                        AddDiffSection(body, "Added Findings", delta.AddedFindings);
                        AddDiffSection(body, "Removed Findings", delta.RemovedFindings);
                        AddDiffSection(body, "Added Required Controls", delta.AddedRequiredControls);
                        AddDiffSection(body, "Removed Required Controls", delta.RemovedRequiredControls);
                        AddDiffSection(body, "Added Warnings", delta.AddedWarnings);
                        AddDiffSection(body, "Removed Warnings", delta.RemovedWarnings);
                        AddDiffSection(body, "Added Evidence References", delta.AddedEvidenceRefs);
                        AddDiffSection(body, "Removed Evidence References", delta.RemovedEvidenceRefs);
                        AddSpacer(body);
                    }
                }

                if (report.ManifestDiff is not null)
                {
                    AddHeading(body, "Manifest Diff", 2);
                    AddDiffSection(body, "Added Services", report.ManifestDiff.AddedServices);
                    AddDiffSection(body, "Removed Services", report.ManifestDiff.RemovedServices);
                    AddDiffSection(body, "Added Datastores", report.ManifestDiff.AddedDatastores);
                    AddDiffSection(body, "Removed Datastores", report.ManifestDiff.RemovedDatastores);
                    AddDiffSection(body, "Added Required Controls", report.ManifestDiff.AddedRequiredControls);
                    AddDiffSection(body, "Removed Required Controls", report.ManifestDiff.RemovedRequiredControls);
                    AddRelationshipDiffSection(body, "Added Relationships", report.ManifestDiff.AddedRelationships);
                    AddRelationshipDiffSection(body, "Removed Relationships", report.ManifestDiff.RemovedRelationships);
                    AddDiffSection(body, "Warnings", report.ManifestDiff.Warnings);
                    AddSpacer(body);
                }

                if (report.ExportDiffs.Count > 0)
                {
                    AddHeading(body, "Export Diffs", 2);
                    foreach (ExportRecordDiffResult diff in report.ExportDiffs)
                    {
                        AddParagraph(body, $"{diff.LeftExportRecordId} -> {diff.RightExportRecordId}", true);
                        AddDiffSection(body, "Changed Top-Level Fields", diff.ChangedTopLevelFields);
                        AddDiffSection(body, "Changed Request Flags", diff.RequestDiff.ChangedFlags);
                        AddDiffSection(body, "Changed Request Values", diff.RequestDiff.ChangedValues);
                        AddDiffSection(body, "Warnings", diff.Warnings);
                        AddSpacer(body);
                    }
                }
            }

            if (!EndToEndComparisonExportProfile.IsShort(p))
            {
                if (!summaryMarkdown.Contains("## Interpretation Notes", StringComparison.Ordinal))
                {
                    AddHeading(body, "Interpretation Notes", 2);
                    AppendListItems(body, report.InterpretationNotes);
                }

                if (!summaryMarkdown.Contains("## Warnings", StringComparison.Ordinal))
                {
                    AddHeading(body, "Warnings", 2);
                    AppendListItems(body, report.Warnings);
                }
            }

            mainPart.Document.Save();
        }

        return Task.FromResult(stream.ToArray());
    }

    private static void AppendSponsorReport(Body body, EndToEndReplayComparisonReport report)
    {
        AddHeading(body, "Key counts", 2);
        AddBullet(body,
            $"Run metadata: {report.RunDiff.ChangedFields.Count} changed field(s); Request IDs differ: {(report.RunDiff.RequestIdsDiffer ? "Yes" : "No")}");
        if (report.AgentResultDiff is not null)
        {
            int withChanges = AgentResultDeltaMateriality.CountWithMaterialChanges(report.AgentResultDiff.AgentDeltas);
            AddBullet(body, $"Agent deltas: {withChanges} agent(s) with material changes");
        }

        if (report.ManifestDiff is not null)
            AddBullet(body, $"Manifest: {ManifestDiffMateriality.FormatSponsorKeyCountsLine(report.ManifestDiff)}");
        AddBullet(body, $"Export diffs: {report.ExportDiffs.Count}");
        AddSpacer(body);
    }

    private static void AddHeading(Body body, string text, int level)
    {
        body.AppendChild(new Paragraph(new ParagraphProperties(new ParagraphStyleId { Val = $"Heading{level}" }), new Run(new Text(text))));
    }

    private static void AddParagraph(Body body, string text, bool bold = false)
    {
        Run run = new(new Text(text) { Space = SpaceProcessingModeValues.Preserve });
        if (bold)
            run.RunProperties = new RunProperties(new Bold());
        body.AppendChild(new Paragraph(run));
    }

    private static void AddBullet(Body body, string text)
    {
        body.AppendChild(new Paragraph(new Run(new Text($"• {text}") { Space = SpaceProcessingModeValues.Preserve })));
    }

    private static void AddSpacer(Body body)
    {
        body.AppendChild(new Paragraph(new Run(new Text(string.Empty))));
    }

    private static void AddDiffSection(Body body, string title, IReadOnlyCollection<string> items)
    {
        AddParagraph(body, title, true);
        AppendListItems(body, items);
    }

    private static void AppendListItems(Body body, IReadOnlyCollection<string> items)
    {
        if (items.Count == 0)
        {
            AddBullet(body, "None");
            return;
        }

        foreach (string item in items)
            AddBullet(body, item);
    }

    private static void AddRelationshipDiffSection(
        Body body,
        string title,
        IReadOnlyCollection<RelationshipDiffItem> relationships)
    {
        AddParagraph(body, title, true);

        if (relationships.Count == 0)
        {
            AddBullet(body, "None");
            return;
        }

        foreach (RelationshipDiffItem relationship in relationships)
            AddBullet(body, relationship.ToDisplayLine());
    }

    private static void AppendCompareQualityDelta(Body body, EndToEndReplayComparisonReport report)
    {
        if (report.CompareQualityDelta is null)
            return;

        AddDiffSection(body, "Compare Quality Delta", CompareQualityDeltaExportFormatter.BuildPlainTextLines(report.CompareQualityDelta));
    }
}
