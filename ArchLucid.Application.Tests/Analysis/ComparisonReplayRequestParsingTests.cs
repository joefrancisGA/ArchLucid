using ArchLucid.Application.Analysis;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class ComparisonReplayRequestParsingTests
{
    [Theory]
    [InlineData(null, "markdown")]
    [InlineData("", "markdown")]
    [InlineData("  HTML  ", "html")]
    public void NormalizeFormat_trims_and_defaults(string? format, string expected)
    {
        ComparisonReplayRequestParsing.NormalizeFormat(format).Should().Be(expected);
    }

    [Theory]
    [InlineData(null, ComparisonReplayMode.ArtifactReplay)]
    [InlineData("artifact", ComparisonReplayMode.ArtifactReplay)]
    [InlineData("REGENERATE", ComparisonReplayMode.Regenerate)]
    [InlineData(" verify ", ComparisonReplayMode.Verify)]
    public void ParseReplayMode_parses_supported_tokens(string? mode, ComparisonReplayMode expected)
    {
        ComparisonReplayRequestParsing.ParseReplayMode(mode).Should().Be(expected);
    }

    [Fact]
    public void ParseReplayMode_unknown_throws_ArgumentException()
    {
        Action act = () => ComparisonReplayRequestParsing.ParseReplayMode("unknown-mode");

        act.Should().Throw<ArgumentException>().WithParameterName("replayMode");
    }

    [Theory]
    [InlineData(ComparisonReplayMode.ArtifactReplay, "artifact")]
    [InlineData(ComparisonReplayMode.Regenerate, "regenerate")]
    [InlineData(ComparisonReplayMode.Verify, "verify")]
    public void FormatReplayMode_round_trips(ComparisonReplayMode mode, string expected)
    {
        ComparisonReplayRequestParsing.FormatReplayMode(mode).Should().Be(expected);
    }
}
