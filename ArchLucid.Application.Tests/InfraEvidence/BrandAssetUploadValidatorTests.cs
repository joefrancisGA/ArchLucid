using ArchLucid.Application.InfraEvidence.Branding;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class BrandAssetUploadValidatorTests
{
    private static readonly byte[] MinimalPng =
        Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");

    [Fact]
    public void Validate_accepts_minimal_png()
    {
        BrandAssetValidationResult result = BrandAssetUploadValidator.Validate(MinimalPng, "logo.png");

        result.Succeeded.Should().BeTrue();
        result.MimeType.Should().Be("image/png");
        result.FileExtension.Should().Be(".png");
    }

    [Fact]
    public void Validate_rejects_oversized_asset()
    {
        byte[] oversized = new byte[BrandAssetUploadValidator.MaxAssetBytes + 1];
        oversized[0] = 0x89;
        oversized[1] = 0x50;
        oversized[2] = 0x4E;
        oversized[3] = 0x47;

        BrandAssetValidationResult result = BrandAssetUploadValidator.Validate(oversized, "logo.png");

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("maximum size");
    }

    [Fact]
    public void Validate_rejects_svg_with_script_tag()
    {
        byte[] svg = "<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>"u8.ToArray();

        BrandAssetValidationResult result = BrandAssetUploadValidator.Validate(svg, "logo.svg");

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("script");
    }

    [Fact]
    public void Validate_rejects_svg_with_foreign_object()
    {
        byte[] svg = "<svg xmlns=\"http://www.w3.org/2000/svg\"><foreignObject></foreignObject></svg>"u8.ToArray();

        BrandAssetValidationResult result = BrandAssetUploadValidator.Validate(svg, "logo.svg");

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("foreignObject");
    }

    [Fact]
    public void Validate_rejects_svg_with_event_handler()
    {
        byte[] svg = "<svg xmlns=\"http://www.w3.org/2000/svg\"><rect onclick=\"evil()\"/></svg>"u8.ToArray();

        BrandAssetValidationResult result = BrandAssetUploadValidator.Validate(svg, "logo.svg");

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("event handler");
    }

    [Fact]
    public void Validate_accepts_safe_svg()
    {
        byte[] svg = "<svg xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"10\" height=\"10\"/></svg>"u8.ToArray();

        BrandAssetValidationResult result = BrandAssetUploadValidator.Validate(svg, "logo.svg");

        result.Succeeded.Should().BeTrue();
        result.MimeType.Should().Be("image/svg+xml");
    }
}
