using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PreCommitInvalidSeverityTests
{
    [Theory]
    [InlineData(-1)]
    [InlineData(4)]
    [InlineData(int.MaxValue)]
    public void InvalidMinimumSeverity_BlocksInsteadOfFailingOpen(int invalidOrdinal)
    {
        var result = PreCommitGateEvaluator.Evaluate(
            [], false, invalidOrdinal, "test-policy", null);

        Assert.True(result.Blocked);
        Assert.Contains("invalid", result.Reason, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ValidMinimumSeverity_WithNoFindings_RemainsAllowed()
    {
        var result = PreCommitGateEvaluator.Evaluate(
            [], false, (int)FindingSeverity.Error, "test-policy", null);

        Assert.False(result.Blocked);
    }
}
