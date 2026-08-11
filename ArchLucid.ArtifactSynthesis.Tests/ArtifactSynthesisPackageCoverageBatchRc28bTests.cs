using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.ArtifactSynthesis.Docx.Helpers;
using ArchLucid.ArtifactSynthesis.Packaging;

using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>
///     RC28b package-coverage batch: DOCX style ids, advisory Terraform copy, and PNG embed helper.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArtifactSynthesisPackageCoverageBatchRc28bTests
{
    // Minimal valid 1x1 PNG.
    private static readonly byte[] OneByOnePng =
    [
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
        0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, 0xFE, 0xD4, 0xEF, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
        0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,
    ];

    [Fact]
    public void DocxStyleIds_and_TerraformAdvisoryExportCopy_expose_stable_strings()
    {
        DocxStyleIds.Title.Should().Be("Title");
        DocxStyleIds.Heading1.Should().Be("Heading1");
        DocxStyleIds.BodyText.Should().Be("BodyText");
        TerraformAdvisoryExportCopy.DisclaimerLine.Should().Contain("advisory");
        TerraformAdvisoryExportCopy.AdvisoryMarkdownBody.Should().Contain("terraform plan");
    }

    [Fact]
    public void ImageHelper_AddPngToBody_embeds_image_part()
    {
        using MemoryStream stream = new();
        using (WordprocessingDocument doc = WordprocessingDocument.Create(stream, WordprocessingDocumentType.Document, true))
        {
            MainDocumentPart main = doc.AddMainDocumentPart();
            main.Document = new Document(new Body());
            ImageHelper.AddPngToBody(doc, main.Document.Body!, OneByOnePng, "Diagram");
            main.Document.Save();

            main.ImageParts.Should().ContainSingle();
            main.Document.Body!.Descendants<Drawing>().Should().NotBeEmpty();
        }
    }

    [Fact]
    public void ImageHelper_AddPngToBody_rejects_null_args()
    {
        using MemoryStream stream = new();
        using WordprocessingDocument doc = WordprocessingDocument.Create(stream, WordprocessingDocumentType.Document, true);
        MainDocumentPart main = doc.AddMainDocumentPart();
        main.Document = new Document(new Body());

        FluentActions
            .Invoking(() => ImageHelper.AddPngToBody(null!, main.Document.Body!, OneByOnePng))
            .Should()
            .Throw<ArgumentNullException>();
        FluentActions
            .Invoking(() => ImageHelper.AddPngToBody(doc, null!, OneByOnePng))
            .Should()
            .Throw<ArgumentNullException>();
        FluentActions
            .Invoking(() => ImageHelper.AddPngToBody(doc, main.Document.Body!, null!))
            .Should()
            .Throw<ArgumentNullException>();
    }
}
