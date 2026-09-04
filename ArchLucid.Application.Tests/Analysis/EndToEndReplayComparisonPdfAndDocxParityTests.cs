using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;

using DocumentFormat.OpenXml.Packaging;

using FluentAssertions;

using Moq;

using UglyToad.PdfPig;

namespace ArchLucid.Application.Tests.Analysis;

/// <summary>
/// PDF/DOCX export parity with markdown/HTML: detailed appendices and interpretation-notes fallback.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class EndToEndReplayComparisonPdfAndDocxParityTests
{
    [SkippableFact]
    public async Task GenerateDocx_detailed_profile_appends_interpretation_notes_when_summary_formatter_omits_them()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Minimal summary stub");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            RunDiff = new RunMetadataDiffResult { ChangedFields = [] },
            InterpretationNotes = ["Catalog model alias differs between the two reviews."],
        };

        byte[] docx = await sut.GenerateDocxAsync(report, CancellationToken.None, EndToEndComparisonExportProfile.Detailed);
        string text = ExtractDocxBodyText(docx);

        text.Should().Contain("Interpretation Notes");
        text.Should().Contain("Catalog model alias differs between the two reviews.");
    }

    [SkippableFact]
    public async Task GenerateDocx_detailed_profile_appends_warnings_when_summary_formatter_omits_them()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Minimal summary stub");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            RunDiff = new RunMetadataDiffResult { ChangedFields = [] },
            Warnings = ["One or both manifests were unavailable for manifest comparison."],
        };

        byte[] docx = await sut.GenerateDocxAsync(report, CancellationToken.None, EndToEndComparisonExportProfile.Detailed);
        string text = ExtractDocxBodyText(docx);

        text.Should().Contain("Warnings");
        text.Should().Contain("One or both manifests were unavailable for manifest comparison.");
    }

    [SkippableFact]
    public async Task GeneratePdf_detailed_profile_includes_run_metadata_diff_section_not_only_key_counts()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Full summary");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            RunDiff = new RunMetadataDiffResult
            {
                ChangedFields = ["Status"],
                RequestIdsDiffer = true,
                StatusDiffers = true,
            },
        };

        byte[] pdf = await sut.GeneratePdfAsync(report, CancellationToken.None, EndToEndComparisonExportProfile.Detailed);
        string text = ExtractPdfText(pdf);

        text.Should().Contain("Changed Field: Status");
        text.Should().NotContain("Key counts");
    }

    [SkippableFact]
    public async Task GeneratePdf_detailed_profile_appends_interpretation_notes_when_summary_formatter_omits_them()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Minimal summary stub");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            RunDiff = new RunMetadataDiffResult { ChangedFields = [] },
            InterpretationNotes = ["Structural execution mode differs between runs."],
        };

        byte[] pdf = await sut.GeneratePdfAsync(report, CancellationToken.None, EndToEndComparisonExportProfile.Detailed);
        string text = ExtractPdfText(pdf);

        text.Should().Contain("between runs.");
        text.Should().NotContain("Key counts");
    }

    [SkippableFact]
    public async Task GeneratePdf_detailed_includes_relationship_subsections_when_populated()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Full summary");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            RunDiff = new RunMetadataDiffResult { ChangedFields = [] },
            ManifestDiff = new ManifestDiffResult
            {
                AddedRelationships =
                [
                    new RelationshipDiffItem { SourceId = "s1", TargetId = "t1", RelationshipType = "calls" }
                ],
                RemovedRelationships =
                [
                    new RelationshipDiffItem { SourceId = "s2", TargetId = "t2", RelationshipType = "reads" }
                ]
            }
        };

        byte[] pdf = await sut.GeneratePdfAsync(report, CancellationToken.None, EndToEndComparisonExportProfile.Detailed);
        string text = ExtractPdfText(pdf);

        text.Should().Contain("s1 -> t1 (calls)");
        text.Should().Contain("s2 -> t2 (reads)");
    }

    [SkippableFact]
    public async Task GenerateDocx_detailed_includes_relationship_subsections_when_populated()
    {
        Mock<IEndToEndReplayComparisonSummaryFormatter> formatter = new();
        formatter.Setup(f => f.FormatMarkdown(It.IsAny<EndToEndReplayComparisonReport>()))
            .Returns("## Full summary");

        EndToEndReplayComparisonExportService sut = new(formatter.Object);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            RunDiff = new RunMetadataDiffResult { ChangedFields = [] },
            ManifestDiff = new ManifestDiffResult
            {
                AddedRelationships =
                [
                    new RelationshipDiffItem { SourceId = "s1", TargetId = "t1", RelationshipType = "calls" }
                ],
                RemovedRelationships =
                [
                    new RelationshipDiffItem { SourceId = "s2", TargetId = "t2", RelationshipType = "reads" }
                ]
            }
        };

        byte[] docx = await sut.GenerateDocxAsync(report, CancellationToken.None, EndToEndComparisonExportProfile.Detailed);
        string text = ExtractDocxBodyText(docx);

        text.Should().Contain("Added Relationships");
        text.Should().Contain("s1 -> t1 (calls)");
        text.Should().Contain("Removed Relationships");
        text.Should().Contain("s2 -> t2 (reads)");
    }

    private static string ExtractDocxBodyText(byte[] docxBytes)
    {
        using MemoryStream ms = new(docxBytes);
        using WordprocessingDocument doc = WordprocessingDocument.Open(ms, false);

        return doc.MainDocumentPart!.Document.Body!.InnerText;
    }

    private static string ExtractPdfText(byte[] pdfBytes)
    {
        using MemoryStream stream = new(pdfBytes);
        using PdfDocument document = PdfDocument.Open(stream);

        return string.Join(
            "\n",
            document.GetPages().Select(page => page.Text?.Trim() ?? string.Empty).Where(text => text.Length > 0));
    }
}
