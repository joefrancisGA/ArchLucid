using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PolicyPackHttpFacadePublishVersionTests
{
    private static readonly ScopeContext CallerScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task PublishVersionAsync_maps_platform_default_republish_to_validation_failed()
    {
        Guid packId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackWorkflowFacade> workflow = new(MockBehavior.Strict);
        workflow
            .Setup(w => w.TryPublishVersionAsync(packId, "1.0.0", "{}", It.IsAny<CancellationToken>()))
            .ThrowsAsync(
                new InvalidOperationException("Platform-default policy packs cannot be republished via API."));

        PolicyPackHttpFacade sut = CreateSut(workflow.Object);

        PolicyPackHttpResult<PolicyPackVersion> result = await sut.PublishVersionAsync(
            packId,
            new PolicyPackPublishBody { Version = "1.0.0", ContentJson = "{}" },
            CancellationToken.None);

        result.Outcome.Should().Be(PolicyPackHttpOutcome.ValidationFailed);
        result.Message.Should().Contain("Platform-default");
        workflow.VerifyAll();
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
