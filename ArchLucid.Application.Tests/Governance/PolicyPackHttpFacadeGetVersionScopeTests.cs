using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PolicyPackHttpFacadeGetVersionScopeTests
{
    private static readonly ScopeContext CallerScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task GetVersionAsync_returns_scope_not_found_when_workspace_is_not_in_tenant()
    {
        Guid packId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = CallerScope.TenantId,
            WorkspaceId = foreignWorkspaceId,
            ProjectId = CallerScope.ProjectId,
        });

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

        Mock<IPolicyPackWorkflowFacade> workflow = new(MockBehavior.Strict);

        PolicyPackHttpFacade sut = new(
            workflow.Object,
            scopeProvider.Object,
            tenants.Object,
            SealedManifestHashTestSupport.CreateRunDetailQueryServiceWithoutCommittedRuns(),
            SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun(),
            SealedManifestHashTestSupport.CreateManifestHashService());

        PolicyPackVersionHttpResult result = await sut.GetVersionAsync(packId, "1.0.0", CancellationToken.None);

        result.Outcome.Should().Be(PolicyPackVersionLookupOutcome.ScopeNotFound);
        workflow.VerifyNoOtherCalls();
    }
}
