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
}
