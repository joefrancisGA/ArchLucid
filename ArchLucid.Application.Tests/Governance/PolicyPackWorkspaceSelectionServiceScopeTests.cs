using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.PolicyPacks;
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
}
