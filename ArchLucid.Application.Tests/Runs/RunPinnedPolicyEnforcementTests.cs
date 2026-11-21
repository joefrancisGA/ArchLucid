using System.Text.Json;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using Moq;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunPinnedPolicyEnforcementTests
{
    [Theory]
    [InlineData(false, false, null)]
    [InlineData(true, false, 1)]
    public async Task CommitTimeEnforcement_PreservesCreateTimeFlags_WhenLiveAssignmentChanges(
        bool liveEnabled, bool liveBlockCritical, int? liveMinimumSeverity)
    {
        Guid packId = Guid.NewGuid();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        RunRecord header = new()
        {
            PinnedPolicyPackIdsJson = JsonSerializer.Serialize(new[]
            {
                new PinnedPolicyPackRow(packId.ToString("D"), "1.0", true, 3)
            }),
        };
        Mock<IPolicyPackAssignmentRepository> repository = new();
        repository.Setup(r => r.ListByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PolicyPackAssignment>
            {
                new()
                {
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    PolicyPackId = packId,
                    PolicyPackVersion = "2.0",
                    IsEnabled = liveEnabled,
                    BlockCommitOnCritical = liveBlockCritical,
                    BlockCommitMinimumSeverity = liveMinimumSeverity,
                }
            });

        IReadOnlyList<PolicyPackAssignment> result = await
            RunHeaderPinnedPolicyPackAssignmentFactory.ResolveCommitTimeAssignmentsWithEnforcementAsync(
                header, scope, repository.Object, CancellationToken.None);

        PolicyPackAssignment assignment = Assert.Single(result);
        Assert.True(assignment.IsEnabled);
        Assert.True(assignment.BlockCommitOnCritical);
        Assert.Equal(3, assignment.BlockCommitMinimumSeverity);
        Assert.Equal("1.0", assignment.PolicyPackVersion);
    }
}
