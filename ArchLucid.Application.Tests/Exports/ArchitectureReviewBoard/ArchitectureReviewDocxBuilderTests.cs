using System.Linq;

using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Exports;

using DocumentFormat.OpenXml.Packaging;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ArchitectureReviewDocxBuilderTests
{
    [Fact]
    public async Task BuildAsync_produces_non_empty_docx_with_main_document_part()
    {
        ArchitectureReviewBoardExportDocumentModel model = new()
        {
            ReviewId = Guid.Parse("a1111111-1111-1111-1111-111111111111"),
            RunId = "run-1",
            RequestId = "req-1",
            SystemName = "Contoso Claims",
            ManifestVersion = "mv-9",
            ExecutiveSummary = "Pilot outcome stable.",
            SystemOverviewBullets = ["Service A orchestrates intake.", "Data tier uses regional replicas."],
            HttpCorrelationId = "corr-abc",
            ExtractorTimestampUtcLabel = "2026-05-16T12:00:00Z"
        };

        ArchitectureReviewDocxBuilder sut = new();
        byte[] bytes =
            await sut.BuildAsync(model, whitelabel: null, logoImageBytes: null, cancellationToken: CancellationToken.None);

        bytes.Should().NotBeNull();
        bytes.Length.Should().BeGreaterThan(200);

        using MemoryStream ms = new(bytes);
        using WordprocessingDocument doc = WordprocessingDocument.Open(ms, false);
        MainDocumentPart? main = doc.MainDocumentPart;
        main.Should().NotBeNull();
        main!.Document.Body.Should().NotBeNull();
    }

    [Fact]
    public async Task BuildAsync_applies_whitelabel_footer_template_resolution()
    {
        ArchitectureReviewBoardExportDocumentModel model = new()
        {
            ReviewId = Guid.NewGuid(),
            RunId = "r2"
        };

        WhitelabelConfiguration whitelabel = new()
        {
            FirmDisplayName = "Northwind Partners",
            ClientEngagementTitle = "ARB — Payments modernization"
        };

        ArchitectureReviewDocxBuilder sut = new();
        byte[] bytes = await sut.BuildAsync(model, whitelabel, logoImageBytes: null, cancellationToken: CancellationToken.None);

        using MemoryStream ms = new(bytes);
        using WordprocessingDocument doc = WordprocessingDocument.Open(ms, false);
        MainDocumentPart main = doc.MainDocumentPart!;
        FooterPart? footer = main.GetPartsOfType<FooterPart>().FirstOrDefault();
        footer.Should().NotBeNull();
        string footerXml = footer!.Footer.OuterXml;

        footerXml.Should().Contain("Prepared by Northwind Partners using ArchLucid");
    }

    [Fact]
    public void ResolveFooterText_defaults_without_whitelabel()
    {
        ArchitectureReviewDocxBuilder.ResolveFooterText(null).Should().Be("Prepared by ArchLucid");
    }
}
