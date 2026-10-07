using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PolicyPackHttpFacadeSetAssignmentEnabledTests
{
    private static readonly ScopeContext CallerScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task SetAssignmentEnabledAsync_invokes_workflow_toggle_once_per_request()
    {
        Guid assignmentId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackWorkflowFacade> workflow = new(MockBehavior.Strict);
        workflow
            .Setup(w => w.TrySetAssignmentEnabledWithOutcomeAsync(assignmentId, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackSetAssignmentEnabledOutcome.Updated);

        PolicyPackHttpFacade sut = CreateSut(workflow.Object);

        PolicyPackHttpResult<bool> result =
            await sut.SetAssignmentEnabledAsync(assignmentId, true, CancellationToken.None);

        result.Outcome.Should().Be(PolicyPackHttpOutcome.Success);
        result.Value.Should().BeTrue();

        workflow.Verify(
            w => w.TrySetAssignmentEnabledWithOutcomeAsync(assignmentId, true, It.IsAny<CancellationToken>()),
            Times.Once);
        workflow.Verify(
            w => w.TrySetAssignmentEnabledAsync(It.IsAny<Guid>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never);
        workflow.VerifyNoOtherCalls();
    }

    private static PolicyPackHttpFacade CreateSut(IPolicyPackWorkflowFacade workflow)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(CallerScope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(t => t.GetByIdAsync(CallerScope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = CallerScope.TenantId, Name = "tenant" });
        tenants
            .Setup(t => t.ListWorkspacesAsync(CallerScope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = CallerScope.WorkspaceId,
                    Name = "workspace",
                },
            ]);

        return new PolicyPackHttpFacade(
            workflow,
            scopeProvider.Object,
            tenants.Object,
            SealedManifestHashTestSupport.CreateRunDetailQueryServiceWithoutCommittedRuns(),
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun(),
            SealedManifestHashTestSupport.CreateManifestHashService());
    }
}
