using ArchLucid.Application.Pilots;

using FluentAssertions;

using UglyToad.PdfPig;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ProductDocumentationPdfBuilderTests
{
  private static readonly ProductDocumentationPdfRenderMetadata SampleMetadata = new()
  {
    Title = "How ArchLucid works",
    VersionDateLabel = "2026-07-10",
    AudienceLabel = "Buyer / sponsor",
    StatusLabel = "Public",
  };

  [Fact]
  public void Build_ReturnsPdfMagicBytesWithCoverAndBodyPages()
  {
    ProductDocumentationPdfBuilder sut = new();

    byte[] pdf = sut.Build("# Overview\n\nArchLucid helps teams review architecture evidence.", SampleMetadata);

    pdf.Should().NotBeNull();
    pdf.Length.Should().BeGreaterThan(100);
    pdf[0].Should().Be(0x25);
    pdf[1].Should().Be(0x50);
    pdf[2].Should().Be(0x44);
    pdf[3].Should().Be(0x46);

    using MemoryStream stream = new(pdf);
    using PdfDocument document = PdfDocument.Open(stream);

    document.NumberOfPages.Should().BeGreaterThanOrEqualTo(2);
  }

  [Fact]
  public void Build_WithLogoBytes_StillReturnsMultiPagePdf()
  {
    ProductDocumentationPdfBuilder sut = new();
    byte[] logoBytes = CreateMinimalPng();

    byte[] pdf = sut.Build("# Overview\n\nBody content.", SampleMetadata, logoBytes);

    using MemoryStream stream = new(pdf);
    using PdfDocument document = PdfDocument.Open(stream);

    document.NumberOfPages.Should().BeGreaterThanOrEqualTo(2);
  }

  [Fact]
  public void Build_WhenTitleMissing_Throws()
  {
    ProductDocumentationPdfBuilder sut = new();
    ProductDocumentationPdfRenderMetadata metadata = new() { Title = "  " };

    Action act = () => sut.Build("body", metadata);

    act.Should().Throw<ArgumentException>();
  }

  private static byte[] CreateMinimalPng()
  {
    return
    [
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82,
    ];
  }
}
