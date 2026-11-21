using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PreCommitMultiplePolicyTests
{
    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void BlockingPolicyWinsRegardlessOfAssignmentOrder(bool blockingIsNewest)
    {
        DateTime now = DateTime.UtcNow;
        PolicyPackAssignment permissive = new()
        {
            PolicyPackId = Guid.NewGuid(),
            IsEnabled = true,
            BlockCommitMinimumSeverity = (int)FindingSeverity.Critical,
            AssignedUtc = blockingIsNewest ? now.AddMinutes(-1) : now,
        };
        PolicyPackAssignment blocking = new()
        {
            PolicyPackId = Guid.NewGuid(),
            IsEnabled = true,
            BlockCommitMinimumSeverity = (int)FindingSeverity.Error,
            AssignedUtc = blockingIsNewest ? now : now.AddMinutes(-1),
        };
        Finding finding = new()
        {
            FindingId = "finding-1",
            Severity = FindingSeverity.Error,
            FindingType = "Test",
            Category = "Test",
            EngineType = "Test",
            Title = "Blocking finding",
            Rationale = "Regression",
        };

        var result = PreCommitGateEvaluator.EvaluateAllAssignments(
            [finding], [permissive, blocking], new PreCommitGovernanceGateOptions());

        Assert.True(result.Blocked);
        Assert.Equal(blocking.PolicyPackId.ToString("N"), result.PolicyPackId);
        Assert.Contains("finding-1", result.BlockingFindingIds);
    }
}
