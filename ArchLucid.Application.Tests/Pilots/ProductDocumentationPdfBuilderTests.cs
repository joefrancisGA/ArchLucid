using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

public sealed class ProductDocumentationPdfBuilderTests
{
    [Fact]
    public void Build_ReturnsPdfMagicBytes()
    {
        ProductDocumentationPdfBuilder sut = new();
        ProductDocumentationPdfRenderMetadata metadata = new()
        {
            Title = "How ArchLucid works",
            VersionDateLabel = "2026-07-10",
            AudienceLabel = "Buyer / sponsor",
            StatusLabel = "Public",
        };

        byte[] pdf = sut.Build("# Overview\n\nArchLucid helps teams review architecture evidence.", metadata);

        pdf.Should().NotBeNull();
        pdf.Length.Should().BeGreaterThan(100);
        pdf[0].Should().Be(0x25);
        pdf[1].Should().Be(0x50);
        pdf[2].Should().Be(0x44);
        pdf[3].Should().Be(0x46);
    }

    [Fact]
    public void Build_WhenTitleMissing_Throws()
    {
        ProductDocumentationPdfBuilder sut = new();
        ProductDocumentationPdfRenderMetadata metadata = new() { Title = "  " };

        Action act = () => sut.Build("body", metadata);

        act.Should().Throw<ArgumentException>();
    }
}
