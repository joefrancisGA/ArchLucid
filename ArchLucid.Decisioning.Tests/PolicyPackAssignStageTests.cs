using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.PolicyPacks.Stages;
using ArchLucid.Persistence.Governance;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class PolicyPackAssignStageTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static readonly Guid PackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    [Fact]
    public async Task AssignAsync_returns_existing_assignment_when_identical_pack_version_scope_retry()
    {
        InMemoryPolicyPackAssignmentRepository repository = new();
        Mock<IPolicyPackResolverCacheInvalidator> invalidator = new();
        invalidator
            .Setup(i => i.InvalidateTenantAsync(TenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IPolicyPackChangeLogAppender> changeLog = new();
        changeLog
            .Setup(c => c.AppendAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        PolicyPackAssignStage sut = new(repository, invalidator.Object, changeLog.Object);

        PolicyPackAssignment first = await sut.AssignAsync(
            TenantId,
            WorkspaceId,
            ProjectId,
            PackId,
            "1.0.0",
            GovernanceScopeLevel.Project,
            isPinned: true,
            isOrganizationRequired: false,
            isEnabled: true,
            CancellationToken.None);

        PolicyPackAssignment second = await sut.AssignAsync(
            TenantId,
            WorkspaceId,
            ProjectId,
            PackId,
            "1.0.0",
            GovernanceScopeLevel.Project,
            isPinned: true,
            isOrganizationRequired: false,
            isEnabled: true,
            CancellationToken.None);

        second.AssignmentId.Should().Be(first.AssignmentId);

        IReadOnlyList<PolicyPackAssignment> rows =
            await repository.ListByScopeAsync(TenantId, WorkspaceId, ProjectId, CancellationToken.None);

        rows.Should().ContainSingle();
        changeLog.Verify(
            c => c.AppendAsync(
                PackId,
                TenantId,
                WorkspaceId,
                ProjectId,
                PolicyPackChangeTypes.Assigned,
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
