using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.Contracts.Roi;
using ArchLucid.Contracts.ValueReports;

using DocumentFormat.OpenXml.Packaging;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ArtifactSynthesis.Tests.Docx;

[Trait("Category", "Unit")]
[Trait("Suite", "ArtifactSynthesis")]
public sealed class DocxValueReportRendererTests
{
    [Fact]
    public async Task RenderAsync_strips_control_chars_from_legacy_run_status_label()
    {
        ValueReportSnapshot snapshot = CreateMinimalSnapshot(
            [new ValueReportRunStatusRow("Completed\u0001", 3)]);

        DocxValueReportRenderer sut = new(NullLogger<DocxValueReportRenderer>.Instance);
        byte[] docx = await sut.RenderAsync(snapshot, CancellationToken.None);

        string xml = ReadMainDocumentXml(docx);
        xml.Should().Contain("Completed: 3");
        xml.Should().NotContain("\u0001");
    }

    [Fact]
    public async Task RenderAsync_strips_control_chars_from_llm_cost_methodology_note()
    {
        ValueReportSnapshot snapshot = CreateMinimalSnapshot(
            [],
            estimatedLlmCostMethodologyNote: "Window estimate\u0001 basis");

        DocxValueReportRenderer sut = new(NullLogger<DocxValueReportRenderer>.Instance);
        byte[] docx = await sut.RenderAsync(snapshot, CancellationToken.None);

        string xml = ReadMainDocumentXml(docx);
        xml.Should().Contain("Window estimate basis");
        xml.Should().NotContain("\u0001");
    }

    private static ValueReportSnapshot CreateMinimalSnapshot(
        IReadOnlyList<ValueReportRunStatusRow> runStatusRows,
        string estimatedLlmCostMethodologyNote = "estimate")
    {
        return new ValueReportSnapshot(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Guid.Parse("33333333-3333-3333-3333-333333333333"),
            DateTimeOffset.Parse("2026-01-01T00:00:00Z"),
            DateTimeOffset.Parse("2026-02-01T00:00:00Z"),
            runStatusRows,
            0,
            0,
            0,
            0,
            0m,
            0m,
            0m,
            0m,
            0m,
            estimatedLlmCostMethodologyNote,
            0m,
            0m,
            0m,
            0m,
            0m,
            null,
            null,
            null,
            null,
            0,
            ReviewCycleBaselineProvenance.NoMeasurementYet,
            null,
            null,
            0,
            0,
            null,
            null);
    }

    private static string ReadMainDocumentXml(byte[] content)
    {
        using MemoryStream stream = new(content);
        using WordprocessingDocument document = WordprocessingDocument.Open(stream, false);

        return document.MainDocumentPart!.Document.OuterXml;
    }
}
