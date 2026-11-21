using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class GlobalPreCommitThresholdValidationTests
{
    [Theory]
    [InlineData("nonsense")]
    [InlineData("Severe")]
    [InlineData("999")]
    [InlineData("-1")]
    public void InvalidNonEmptyThreshold_IsRejected(string threshold)
    {
        Assert.True(PreCommitGateThresholdParser.IsInvalidConfiguredThreshold(threshold));
        Assert.Null(PreCommitGateThresholdParser.TryParseMinimumSeverity(threshold));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("  ")]
    public void MissingOptionalThreshold_IsNotInvalid(string? threshold)
    {
        Assert.False(PreCommitGateThresholdParser.IsInvalidConfiguredThreshold(threshold));
    }

    [Theory]
    [InlineData("Error", FindingSeverity.Error)]
    [InlineData("High", FindingSeverity.Error)]
    [InlineData("Critical", FindingSeverity.Critical)]
    [InlineData("warning", FindingSeverity.Warning)]
    public void ValidThresholds_AreStillAccepted(string threshold, FindingSeverity expected)
    {
        Assert.False(PreCommitGateThresholdParser.IsInvalidConfiguredThreshold(threshold));
        Assert.Equal(expected, PreCommitGateThresholdParser.TryParseMinimumSeverity(threshold));
    }
}
