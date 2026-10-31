using ArchLucid.ArtifactSynthesis.FindingVerification;
using ArchLucid.ArtifactSynthesis.FindingVerification.Models;
using ArchLucid.Core.Findings;

using DocumentFormat.OpenXml.Packaging;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests.FindingVerification;

[Trait("Category", "Unit")]
public sealed class FindingVerificationReportDocxRendererTests
{
    [Fact]
    public void Render_strips_control_chars_from_finding_table_cells()
    {
        const string titleWithControlChar = "Public\u0001 storage";

        FindingVerificationReportDocumentModel model = CreateModel(
            new FindingVerificationReportFindingRow
            {
                FindingId = "finding-a",
                Title = titleWithControlChar,
                Severity = "Critical",
                Status = "Materialized",
                TraceText = "RV-003 matched",
            });

        byte[] docx = FindingVerificationReportDocxRenderer.Render(model);

        using MemoryStream stream = new(docx);
        using WordprocessingDocument document = WordprocessingDocument.Open(stream, false);
        string xml = document.MainDocumentPart!.Document.OuterXml;

        xml.Should().Contain("Public storage");
        xml.Should().NotContain("\u0001");
    }

    [Fact]
    public void Render_strips_control_chars_from_package_reference_hash_fields()
    {
        FindingVerificationReportDocumentModel model = CreateModel(
            new FindingVerificationReportFindingRow
            {
                FindingId = "finding-a",
                Title = "Title",
                Severity = "Low",
                Status = "Materialized",
                TraceText = "trace",
            },
            sourceManifestHash: "sha256-sealed\u0001hash",
            reportHash: "sha256-report\u0002hash");

        byte[] docx = FindingVerificationReportDocxRenderer.Render(model);

        using MemoryStream stream = new(docx);
        using WordprocessingDocument document = WordprocessingDocument.Open(stream, false);
        string xml = document.MainDocumentPart!.Document.OuterXml;

        xml.Should().Contain("sha256-sealedhash");
        xml.Should().Contain("sha256-reporthash");
        xml.Should().NotContain("\u0001");
        xml.Should().NotContain("\u0002");
    }

    [Fact]
    public void Render_includes_severity_column_matching_markdown_export()
    {
        FindingVerificationReportDocumentModel model = CreateModel(
            new FindingVerificationReportFindingRow
            {
                FindingId = "finding-a",
                Title = "Public storage",
                Severity = "Critical",
                Status = "Materialized",
                TraceText = "RV-003 matched",
            });

        byte[] docx = FindingVerificationReportDocxRenderer.Render(model);

        using MemoryStream stream = new(docx);
        using WordprocessingDocument document = WordprocessingDocument.Open(stream, false);
        string xml = document.MainDocumentPart!.Document.OuterXml;

        xml.Should().Contain("Severity");
        xml.Should().Contain("Critical");
    }

    [Fact]
    public void Render_labels_blank_finding_cells_as_stored_empty_per_column()
    {
        FindingVerificationReportDocumentModel model = CreateModel(
            new FindingVerificationReportFindingRow
            {
                FindingId = "finding-a",
                Title = "   ",
                Severity = "",
                Status = "Materialized",
                TraceText = "RV-003 matched",
            });

        byte[] docx = FindingVerificationReportDocxRenderer.Render(model);

        using MemoryStream stream = new(docx);
        using WordprocessingDocument document = WordprocessingDocument.Open(stream, false);
        string xml = document.MainDocumentPart!.Document.OuterXml;

        xml.Should().Contain("Title was stored empty.");
        xml.Should().Contain("Severity was stored empty.");
        xml.Should().NotContain("Value was not stored.");
    }

    private static FindingVerificationReportDocumentModel CreateModel(
        FindingVerificationReportFindingRow finding,
        string sourceManifestHash = "sha256-sealed",
        string reportHash = "sha256-report")
    {
        return new FindingVerificationReportDocumentModel
        {
            ReportId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            RunId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            SourceManifestHash = sourceManifestHash,
            ReportHash = reportHash,
            CreatedUtc = new DateTime(2026, 9, 8, 12, 0, 0, DateTimeKind.Utc),
            Summary = new FindingVerificationReportConfirmedRateSummary
            {
                TotalResults = 1,
                MaterializedCount = 1,
                MitigatedCount = 0,
                NotObservedCount = 0,
                NotVerifiableCount = 0,
                VerifiableDenominator = 1,
                ConfirmedNumerator = 1,
                ConfirmedRate = 1.0,
            },
            Findings = [finding],
        };
    }
}
