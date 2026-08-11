using ArchLucid.Application.Analysis;

using FluentAssertions;

namespace ArchLucid.Application.Tests;

/// <summary>
///     RC28f package-coverage batch: comparison replay request parsing and mode formatting.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApplicationPackageCoverageBatchRc28fTests
{
    [Theory]
    [InlineData(null, "markdown")]
    [InlineData("", "markdown")]
    [InlineData("  JSON  ", "json")]
    public void ComparisonReplayRequestParsing_NormalizeFormat_defaults_and_trims(string? format, string expected)
    {
        ComparisonReplayRequestParsing.NormalizeFormat(format).Should().Be(expected);
    }

    [Theory]
    [InlineData(null, ComparisonReplayMode.ArtifactReplay)]
    [InlineData("artifact", ComparisonReplayMode.ArtifactReplay)]
    [InlineData("REGENERATE", ComparisonReplayMode.Regenerate)]
    [InlineData("verify", ComparisonReplayMode.Verify)]
    public void ComparisonReplayRequestParsing_ParseReplayMode_maps_supported_tokens(string? replayMode, ComparisonReplayMode expected)
    {
        ComparisonReplayRequestParsing.ParseReplayMode(replayMode).Should().Be(expected);
    }

    [Fact]
    public void ComparisonReplayRequestParsing_ParseReplayMode_throws_for_unknown_mode()
    {
        FluentActions
            .Invoking(() => ComparisonReplayRequestParsing.ParseReplayMode("replay-everything"))
            .Should()
            .Throw<ArgumentException>()
            .WithParameterName("replayMode");
    }

    [Theory]
    [InlineData(ComparisonReplayMode.ArtifactReplay, "artifact")]
    [InlineData(ComparisonReplayMode.Regenerate, "regenerate")]
    [InlineData(ComparisonReplayMode.Verify, "verify")]
    public void ComparisonReplayRequestParsing_FormatReplayMode_round_trips(ComparisonReplayMode mode, string expectedToken)
    {
        ComparisonReplayRequestParsing.FormatReplayMode(mode).Should().Be(expectedToken);
    }
}
