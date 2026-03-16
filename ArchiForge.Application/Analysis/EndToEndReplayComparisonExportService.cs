using System.Text;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchiForge.Application.Analysis;

public sealed class EndToEndReplayComparisonExportService
    : IEndToEndReplayComparisonExportService
{
    private readonly IEndToEndReplayComparisonSummaryFormatter _summaryFormatter;

    public EndToEndReplayComparisonExportService(
        IEndToEndReplayComparisonSummaryFormatter summaryFormatter)
    {
        _summaryFormatter = summaryFormatter;
    }

    public string GenerateMarkdown(EndToEndReplayComparisonReport report)
    {
        ArgumentNullException.ThrowIfNull(report);

        var sb = new StringBuilder();

        sb.AppendLine("# ArchiForge End-to-End Replay Comparison Export");
        sb.AppendLine();
        sb.AppendLine($"- Left Run ID: {report.LeftRunId}");
        sb.AppendLine($"- Right Run ID: {report.RightRunId}");
        sb.AppendLine($"- Generated UTC: {DateTime.UtcNow:O}");
        sb.AppendLine();
        sb.AppendLine("---");
        sb.AppendLine();

        sb.AppendLine(_summaryFormatter.FormatMarkdown(report).Trim());
        sb.AppendLine();
        sb.AppendLine("---");
        sb.AppendLine();

        sb.AppendLine("## Run Metadata Diff");
        sb.AppendLine();
        AppendList(sb, "Changed Fields", report.RunDiff.ChangedFields);
        sb.AppendLine($"- Request IDs Differ: {(report.RunDiff.RequestIdsDiffer ? "Yes" : "No")}");
        sb.AppendLine($"- Manifest Versions Differ: {(report.RunDiff.ManifestVersionsDiffer ? "Yes" : "No")}");
        sb.AppendLine($"- Status Differs: {(report.RunDiff.StatusDiffers ? "Yes" : "No")}");
        sb.AppendLine($"- Completion State Differs: {(report.RunDiff.CompletionStateDiffers ? "Yes" : "No")}");
        sb.AppendLine();

        if (report.AgentResultDiff is not null)
        {
            sb.AppendLine("## Agent Result Diff");
            sb.AppendLine();

            foreach (var delta in report.AgentResultDiff.AgentDeltas.OrderBy(x => x.AgentType))
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

        if (report.ManifestDiff is not null)
        {
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

                foreach (var rel in report.ManifestDiff.AddedRelationships)
                {
                    sb.AppendLine($"- {rel.SourceId} -> {rel.TargetId} ({rel.RelationshipType})");
                }

                sb.AppendLine();
            }

            if (report.ManifestDiff.RemovedRelationships.Count > 0)
            {
                sb.AppendLine("### Removed Relationships");
                sb.AppendLine();

                foreach (var rel in report.ManifestDiff.RemovedRelationships)
                {
                    sb.AppendLine($"- {rel.SourceId} -> {rel.TargetId} ({rel.RelationshipType})");
                }

                sb.AppendLine();
            }
        }

        if (report.ExportDiffs.Count > 0)
        {
            sb.AppendLine("## Export Diffs");
            sb.AppendLine();

            foreach (var diff in report.ExportDiffs)
            {
                sb.AppendLine($"### {diff.LeftExportRecordId} -> {diff.RightExportRecordId}");
                sb.AppendLine();
                AppendList(sb, "Changed Top-Level Fields", diff.ChangedTopLevelFields);
                AppendList(sb, "Changed Request Flags", diff.RequestDiff.ChangedFlags);
                AppendList(sb, "Changed Request Values", diff.RequestDiff.ChangedValues);
                AppendList(sb, "Warnings", diff.Warnings);
            }
        }

        AppendList(sb, "Interpretation Notes", report.InterpretationNotes);
        AppendList(sb, "Warnings", report.Warnings);

        return sb.ToString();
    }

    public Task<byte[]> GenerateDocxAsync(
        EndToEndReplayComparisonReport report,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(report);

        using var stream = new MemoryStream();

        using (var document = WordprocessingDocument.Create(
                   stream,
                   WordprocessingDocumentType.Document,
                   true))
        {
            var mainPart = document.AddMainDocumentPart();
            mainPart.Document = new Document(new Body());

            var body = mainPart.Document.Body!;

            AddHeading(body, "ArchiForge End-to-End Replay Comparison", 1);

            AddParagraph(body, $"Left Run ID: {report.LeftRunId}");
            AddParagraph(body, $"Right Run ID: {report.RightRunId}");
            AddParagraph(body, $"Generated UTC: {DateTime.UtcNow:O}");
            AddSpacer(body);

            AddHeading(body, "Run Metadata Diff", 2);
            AddBullet(body, $"Request IDs Differ: {(report.RunDiff.RequestIdsDiffer ? "Yes" : "No")}");
            AddBullet(body, $"Manifest Versions Differ: {(report.RunDiff.ManifestVersionsDiffer ? "Yes" : "No")}");
            AddBullet(body, $"Status Differs: {(report.RunDiff.StatusDiffers ? "Yes" : "No")}");
            AddBullet(body, $"Completion State Differs: {(report.RunDiff.CompletionStateDiffers ? "Yes" : "No")}");

            foreach (var field in report.RunDiff.ChangedFields)
            {
                AddBullet(body, $"Changed Field: {field}");
            }

            AddSpacer(body);

            if (report.AgentResultDiff is not null)
            {
                AddHeading(body, "Agent Result Diff", 2);

                foreach (var delta in report.AgentResultDiff.AgentDeltas.OrderBy(x => x.AgentType))
                {
                    AddParagraph(body, delta.AgentType.ToString(), bold: true);
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
                AddSpacer(body);
            }

            if (report.ExportDiffs.Count > 0)
            {
                AddHeading(body, "Export Diffs", 2);

                foreach (var diff in report.ExportDiffs)
                {
                    AddParagraph(body, $"{diff.LeftExportRecordId} -> {diff.RightExportRecordId}", bold: true);
                    AddDiffSection(body, "Changed Top-Level Fields", diff.ChangedTopLevelFields);
                    AddDiffSection(body, "Changed Request Flags", diff.RequestDiff.ChangedFlags);
                    AddDiffSection(body, "Changed Request Values", diff.RequestDiff.ChangedValues);
                    AddDiffSection(body, "Warnings", diff.Warnings);
                    AddSpacer(body);
                }
            }

            AddHeading(body, "Interpretation Notes", 2);
            AddDiffSection(body, "Notes", report.InterpretationNotes);

            AddHeading(body, "Warnings", 2);
            AddDiffSection(body, "Warnings", report.Warnings);

            mainPart.Document.Save();
        }

        return Task.FromResult(stream.ToArray());
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

        foreach (var item in items)
        {
            sb.AppendLine($"- {item}");
        }

        sb.AppendLine();
    }

    private static void AddHeading(Body body, string text, int level)
    {
        body.AppendChild(new Paragraph(
            new ParagraphProperties(
                new ParagraphStyleId { Val = $"Heading{level}" }),
            new Run(new Text(text))));
    }

    private static void AddParagraph(Body body, string text, bool bold = false)
    {
        var run = new Run(new Text(text) { Space = SpaceProcessingModeValues.Preserve });

        if (bold)
        {
            run.RunProperties = new RunProperties(new Bold());
        }

        body.AppendChild(new Paragraph(run));
    }

    private static void AddBullet(Body body, string text)
    {
        body.AppendChild(new Paragraph(
            new Run(new Text($"• {text}") { Space = SpaceProcessingModeValues.Preserve })));
    }

    private static void AddSpacer(Body body)
    {
        body.AppendChild(new Paragraph(new Run(new Text(string.Empty))));
    }

    private static void AddDiffSection(Body body, string title, IReadOnlyCollection<string> items)
    {
        AddParagraph(body, title, bold: true);

        if (items.Count == 0)
        {
            AddBullet(body, "None");
            return;
        }

        foreach (var item in items)
        {
            AddBullet(body, item);
        }
    }
}

