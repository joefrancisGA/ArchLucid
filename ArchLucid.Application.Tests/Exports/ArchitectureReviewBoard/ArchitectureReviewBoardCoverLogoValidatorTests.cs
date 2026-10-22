using ArchLucid.Application.Exports.ArchitectureReviewBoard;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ArchitectureReviewBoardCoverLogoValidatorTests
{
    private static readonly byte[] MinimalPng =
        Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");

    [Fact]
    public void ValidateLogo_rejects_empty_payload()
    {
        Action act = () => ArchitectureReviewBoardCoverLogoValidator.ValidateLogo(Array.Empty<byte>());

        act.Should().Throw<ArgumentException>().WithMessage("*empty*");
    }

    [Fact]
    public void ValidateLogo_rejects_bmp_magic_even_when_common_mislabeled_as_image()
    {
        byte[] bmp = [0x42, 0x4D, 0x00, 0x00];

        Action act = () => ArchitectureReviewBoardCoverLogoValidator.ValidateLogo(bmp);

        act.Should().Throw<ArgumentException>().WithMessage("*PNG or JPEG*");
    }

    [Fact]
    public void ValidateLogo_rejects_webp_container_magic()
    {
        byte[] webp =
        [
            0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x00
        ];

        Action act = () => ArchitectureReviewBoardCoverLogoValidator.ValidateLogo(webp);

        act.Should().Throw<ArgumentException>().WithMessage("*PNG or JPEG*");
    }

    [Fact]
    public void ValidateLogo_accepts_png_magic_bytes()
    {
        Action act = () => ArchitectureReviewBoardCoverLogoValidator.ValidateLogo(MinimalPng);

        act.Should().NotThrow();
    }

    [Fact]
    public void ValidateLogo_accepts_jpeg_magic_bytes()
    {
        byte[] jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0x00];

        Action act = () => ArchitectureReviewBoardCoverLogoValidator.ValidateLogo(jpeg);

        act.Should().NotThrow();
    }

    [Fact]
    public void ValidateLogo_rejects_unknown_magic_bytes()
    {
        byte[] gif = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61];

        Action act = () => ArchitectureReviewBoardCoverLogoValidator.ValidateLogo(gif);

        act.Should().Throw<ArgumentException>().WithMessage("*PNG or JPEG*");
    }

    [Fact]
    public void ValidateLogo_rejects_payload_over_2mb()
    {
        byte[] tooLarge = new byte[ArchitectureReviewBoardCoverLogoValidator.MaxLogoBytes + 1];
        tooLarge[0] = 0x89;
        tooLarge[1] = 0x50;
        tooLarge[2] = 0x4E;
        tooLarge[3] = 0x47;

        Action act = () => ArchitectureReviewBoardCoverLogoValidator.ValidateLogo(tooLarge);

        act.Should().Throw<ArgumentException>().WithMessage("*maximum size*");
    }

    [Fact]
    public void ValidateLogoOptional_skips_null()
    {
        Action act = () => ArchitectureReviewBoardCoverLogoValidator.ValidateLogoOptional(null);

        act.Should().NotThrow();
    }
}
