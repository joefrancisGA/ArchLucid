using ArchLucid.Contracts.Exports;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Exports;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ExportProfileNameMappingsTests
{
    [Fact]
    public void ToCanonicalToken_returns_review_board_slug()
    {
        ExportProfileNameMappings.ToCanonicalToken(ExportProfileName.ArchitectureReviewBoard)
            .Should().Be(ArchitectureReviewBoardExportProfile.Token);
    }

    [Fact]
    public void TryParseToken_matches_review_board_slug_case_insensitively()
    {
        bool parsed =
            ExportProfileNameMappings.TryParseToken("  ARCHITECTURE-REVIEW-BOARD ", out ExportProfileName profile);

        parsed.Should().BeTrue();
        profile.Should().Be(ExportProfileName.ArchitectureReviewBoard);
    }

    [Fact]
    public void TryParseToken_returns_false_for_unknown_slug_and_unknown_numeric_discriminator_out_param()
    {
        bool parsed = ExportProfileNameMappings.TryParseToken("unknown", out ExportProfileName profile);

        parsed.Should().BeFalse();

        int numeric = (int)profile;

        numeric.Should().Be(0);
    }
}
