using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Findings;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingInspectReadModelMapperTests
{
    [Theory]
    [InlineData(null, FindingSeverity.Info)]
    [InlineData("", FindingSeverity.Info)]
    [InlineData("  ", FindingSeverity.Info)]
    [InlineData("critical", FindingSeverity.Critical)]
    [InlineData("UNKNOWN", FindingSeverity.Info)]
    public void ParseFindingSeverity_maps_or_defaults(string? raw, FindingSeverity expected)
    {
        FindingSeverity actual = FindingInspectReadModelMapper.ParseFindingSeverity(raw);

        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData(null, FindingHumanReviewStatus.NotRequired)]
    [InlineData("Pending", FindingHumanReviewStatus.Pending)]
    [InlineData("bad", FindingHumanReviewStatus.NotRequired)]
    public void ParseHumanReview_maps_or_defaults(string? raw, FindingHumanReviewStatus expected)
    {
        FindingHumanReviewStatus actual = FindingInspectReadModelMapper.ParseHumanReview(raw);

        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("not-a-level")]
    public void TryParseEvaluationConfidenceLevel_returns_null_for_missing_or_invalid(string? raw)
    {
        FindingConfidenceLevel? actual = FindingInspectReadModelMapper.TryParseEvaluationConfidenceLevel(raw);

        actual.Should().BeNull();
    }

    [Fact]
    public void TryParseEvaluationConfidenceLevel_parses_known_value()
    {
        FindingConfidenceLevel? actual = FindingInspectReadModelMapper.TryParseEvaluationConfidenceLevel("High");

        actual.Should().Be(FindingConfidenceLevel.High);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void ParseDisposition_returns_null_for_blank(string? raw)
    {
        FindingDisposition? actual = FindingInspectReadModelMapper.ParseDisposition(raw);

        actual.Should().BeNull();
    }

    [Fact]
    public void ParseDisposition_parses_known_value()
    {
        FindingDisposition? actual = FindingInspectReadModelMapper.ParseDisposition("Accepted");

        actual.Should().Be(FindingDisposition.Accepted);
    }
}
