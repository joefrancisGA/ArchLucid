using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PreCommitGateThresholdParserTests
{
    [Theory]
    [InlineData("Critical", FindingSeverity.Critical)]
    [InlineData("Error", FindingSeverity.Error)]
    [InlineData("High", FindingSeverity.Error)]
    public void TryParseMinimumSeverity_maps_known_labels(string input, FindingSeverity expected)
    {
        FindingSeverity? actual = PreCommitGateThresholdParser.TryParseMinimumSeverity(input);

        actual.Should().Be(expected);
    }

    [Fact]
    public void TryParseMinimumSeverity_returns_null_for_blank()
    {
        PreCommitGateThresholdParser.TryParseMinimumSeverity(null).Should().BeNull();
        PreCommitGateThresholdParser.TryParseMinimumSeverity("   ").Should().BeNull();
    }

    [Theory]
    [InlineData("999")]
    [InlineData("99")]
    public void TryParseMinimumSeverity_returns_null_for_undefined_numeric_values(string input)
    {
        PreCommitGateThresholdParser.TryParseMinimumSeverity(input).Should().BeNull();
    }

    [Theory]
    [InlineData(99)]
    [InlineData(999)]
    public void TryCoerceDefinedSeverityOrdinal_returns_null_for_undefined_values(int ordinal)
    {
        PreCommitGateThresholdParser.TryCoerceDefinedSeverityOrdinal(ordinal).Should().BeNull();
    }

    [Fact]
    public void TryParseMinimumSeverityOrdinalFromMetadata_ignores_undefined_numeric_strings()
    {
        Dictionary<string, string> metadata = new(StringComparer.Ordinal)
        {
            ["blockCommitMinimumSeverity"] = "99",
        };

        PreCommitGateThresholdParser.TryParseMinimumSeverityOrdinalFromMetadata(
                metadata,
                ["blockCommitMinimumSeverity"])
            .Should()
            .BeNull();
    }
}
