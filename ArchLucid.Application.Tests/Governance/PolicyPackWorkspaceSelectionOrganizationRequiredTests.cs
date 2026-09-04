using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PolicyPackWorkspaceSelectionOrganizationRequiredTests
{
    private static readonly ScopeContext CallerScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task TrySetAssignmentEnabled_returns_false_when_assignment_is_organization_required()
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
                    WorkspaceId = CallerScope.WorkspaceId,
                    ProjectId = CallerScope.ProjectId,
                    PolicyPackId = packId,
                    PolicyPackVersion = "1.0.0",
                    IsEnabled = true,
                    IsOrganizationRequired = true,
                });

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPack
                {
                    PolicyPackId = packId,
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = CallerScope.WorkspaceId,
                    ProjectId = CallerScope.ProjectId,
                    Name = "org-required-pack",
                    CurrentVersion = "1.0.0",
                });

        PolicyPackWorkspaceSelectionService sut = new(
            packs.Object,
            assignments.Object,
            Mock.Of<IPlatformBundledPolicyPackAvailability>(s => s.IsGloballyActiveAsync(It.IsAny<PolicyPack>(), It.IsAny<CancellationToken>()) == ValueTask.FromResult(true)),
            Mock.Of<IPolicyPackResolverCacheInvalidator>());

        bool ok = await sut.TrySetAssignmentEnabledAsync(CallerScope, assignmentId, false, CancellationToken.None);

        ok.Should().BeFalse();
    }

    [Fact]
    public async Task TrySetAssignmentOrganizationRequired_persists_flag_and_enables_assignment()
    {
        Guid assignmentId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid packId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        PolicyPackAssignment assignment = new()
        {
            AssignmentId = assignmentId,
            TenantId = CallerScope.TenantId,
            WorkspaceId = CallerScope.WorkspaceId,
            ProjectId = CallerScope.ProjectId,
            PolicyPackId = packId,
            PolicyPackVersion = "1.0.0",
            IsEnabled = false,
            IsOrganizationRequired = false,
        };

        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(r => r.GetByTenantAndAssignmentIdAsync(CallerScope.TenantId, assignmentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(assignment);
        assignments
            .Setup(r => r.UpdateAsync(It.IsAny<PolicyPackAssignment>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPack
                {
                    PolicyPackId = packId,
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = CallerScope.WorkspaceId,
                    ProjectId = CallerScope.ProjectId,
                    Name = "pack",
                    CurrentVersion = "1.0.0",
                });

        PolicyPackWorkspaceSelectionService sut = new(
            packs.Object,
            assignments.Object,
            Mock.Of<IPlatformBundledPolicyPackAvailability>(),
            Mock.Of<IPolicyPackResolverCacheInvalidator>());

        bool ok = await sut.TrySetAssignmentOrganizationRequiredAsync(CallerScope, assignmentId, true, CancellationToken.None);

        ok.Should().BeTrue();
        assignment.IsOrganizationRequired.Should().BeTrue();
        assignment.IsEnabled.Should().BeTrue();
    }
}
