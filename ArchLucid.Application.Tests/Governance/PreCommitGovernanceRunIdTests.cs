using ArchLucid.Application.Governance;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PreCommitGovernanceRunIdTests
{
    [Theory]
    [InlineData("not-a-guid")]
    [InlineData("00000000-0000-0000-0000-000000000000")]
    public void EnabledGovernance_BlocksInvalidRunIdentifiers(string runId)
    {
        var result = PreCommitGovernanceGate.ValidateRunIdForGovernance(runId, governanceEnabled: true);

        Assert.NotNull(result);
        Assert.True(result.Blocked);
        Assert.Contains("invalid", result.Reason, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData("not-a-guid")]
    [InlineData("00000000-0000-0000-0000-000000000000")]
    public void DisabledGovernance_RetainsAllowedBehavior(string runId)
    {
        var result = PreCommitGovernanceGate.ValidateRunIdForGovernance(runId, governanceEnabled: false);

        Assert.NotNull(result);
        Assert.False(result.Blocked);
    }

    [Fact]
    public void EnabledGovernance_ValidRunIdContinuesToFullEvaluation()
    {
        var result = PreCommitGovernanceGate.ValidateRunIdForGovernance(
            Guid.NewGuid().ToString("D"), governanceEnabled: true);

        Assert.Null(result);
    }
}
