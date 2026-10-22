using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PolicyPackWorkspaceSelectionServiceScopeTests
{
    private static readonly ScopeContext CallerScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task TrySetAssignmentEnabled_returns_false_when_assignment_is_in_another_workspace()
    {
        Guid assignmentId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid packId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(r => r.GetByTenantAndAssignmentIdAsync(CallerScope.TenantId, assignmentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPackAssignment
                {
                    AssignmentId = assignmentId,
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    PolicyPackId = packId,
                    PolicyPackVersion = "1.0.0",
                    IsEnabled = true,
                });

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPack
                {
                    PolicyPackId = packId,
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    Name = "foreign-workspace-pack",
                    CurrentVersion = "1.0.0",
                });

        PolicyPackWorkspaceSelectionService sut = new(
            packs.Object,
            assignments.Object,
            Mock.Of<IPlatformBundledPolicyPackAvailability>(),
            Mock.Of<IPolicyPackResolverCacheInvalidator>());

        bool ok = await sut.TrySetAssignmentEnabledAsync(CallerScope, assignmentId, false, CancellationToken.None);

        ok.Should().BeFalse();
        assignments.Verify(
            r => r.UpdateAsync(It.IsAny<PolicyPackAssignment>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ListAsync_prefers_project_assignment_over_newer_tenant_assignment()
    {
        Guid packId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        Guid tenantAssignmentId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid projectAssignmentId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        // ListByScopeAsync returns AssignedUtc descending, so the newer tenant row arrives first.
        PolicyPackAssignment newerTenant = new()
        {
            AssignmentId = tenantAssignmentId,
            TenantId = CallerScope.TenantId,
            WorkspaceId = Guid.Empty,
            ProjectId = Guid.Empty,
            PolicyPackId = packId,
            PolicyPackVersion = "2.0.0",
            ScopeLevel = GovernanceScopeLevel.Tenant,
            IsEnabled = true,
            AssignedUtc = new DateTime(2026, 10, 9, 12, 0, 0, DateTimeKind.Utc),
        };
        PolicyPackAssignment olderProject = new()
        {
            AssignmentId = projectAssignmentId,
            TenantId = CallerScope.TenantId,
            WorkspaceId = CallerScope.WorkspaceId,
            ProjectId = CallerScope.ProjectId,
            PolicyPackId = packId,
            PolicyPackVersion = "1.0.0",
            ScopeLevel = GovernanceScopeLevel.Project,
            IsEnabled = false,
            AssignedUtc = new DateTime(2026, 10, 1, 12, 0, 0, DateTimeKind.Utc),
        };

        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(r => r.ListByScopeAsync(
                CallerScope.TenantId,
                CallerScope.WorkspaceId,
                CallerScope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([newerTenant, olderProject]);

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.ListByScopeAsync(
                CallerScope.TenantId,
                CallerScope.WorkspaceId,
                CallerScope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new PolicyPack
                {
                    PolicyPackId = packId,
                    TenantId = CallerScope.TenantId,
                    Name = "payments-baseline",
                    CurrentVersion = "2.0.0",
                },
            ]);

        Mock<IPlatformBundledPolicyPackAvailability> platformAvailability = new();
        platformAvailability
            .Setup(s => s.IsGloballyActiveAsync(It.IsAny<PolicyPack>(), It.IsAny<CancellationToken>()))
            .Returns(new ValueTask<bool>(true));

        PolicyPackWorkspaceSelectionService sut = new(
            packs.Object,
            assignments.Object,
            platformAvailability.Object,
            Mock.Of<IPolicyPackResolverCacheInvalidator>());

        IReadOnlyList<PolicyPackWorkspaceSelectionItem> rows = await sut.ListAsync(
            CallerScope.TenantId,
            CallerScope.WorkspaceId,
            CallerScope.ProjectId,
            CancellationToken.None);

        PolicyPackWorkspaceSelectionItem row = rows.Should().ContainSingle().Subject;
        row.AssignmentId.Should().Be(projectAssignmentId);
        row.IsEnabled.Should().BeFalse();
    }
}
