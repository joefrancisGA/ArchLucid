using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PolicyPackWorkflowFacadeTests
{
    private static readonly ScopeContext CallerScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task TryPublishVersionAsync_returns_null_when_pack_is_out_of_scope()
    {
        Guid foreignPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(foreignPackId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPack
                {
                    PolicyPackId = foreignPackId,
                    TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    Name = "foreign-pack",
                    CurrentVersion = "1.0.0",
                    IsDeleted = false,
                });

        Mock<IPolicyPacksAppService> appService = new(MockBehavior.Strict);

        PolicyPackWorkflowFacade sut = CreateSut(packs.Object, appService: appService.Object);

        PolicyPackVersion? result = await sut.TryPublishVersionAsync(
            foreignPackId,
            "2.0.0",
            """{"complianceRuleIds":[]}""",
            CancellationToken.None);

        result.Should().BeNull();
        appService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task TryAssignAsync_returns_pack_not_found_when_pack_is_out_of_scope()
    {
        Guid foreignPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(foreignPackId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPack
                {
                    PolicyPackId = foreignPackId,
                    TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    Name = "foreign-pack",
                    CurrentVersion = "1.0.0",
                    IsDeleted = false,
                });

        PolicyPackWorkflowFacade sut = CreateSut(packs.Object);

        PolicyPackAssignWorkflowResult result = await sut.TryAssignAsync(
            foreignPackId,
            "1.0.0",
            "Project",
            false,
            CancellationToken.None);

        result.Outcome.Should().Be(PolicyPackAssignOutcome.PackNotFound);
        result.Assignment.Should().BeNull();
    }

    [Fact]
    public async Task TryDuplicatePackAsync_returns_null_when_pack_is_out_of_scope()
    {
        Guid foreignPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(foreignPackId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPack
                {
                    PolicyPackId = foreignPackId,
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    Name = "foreign-workspace-pack",
                    CurrentVersion = "1.0.0",
                    IsDeleted = false,
                });

        Mock<IPolicyPacksAppService> appService = new(MockBehavior.Strict);

        PolicyPackWorkflowFacade sut = CreateSut(packs.Object, appService: appService.Object);

        PolicyPack? result = await sut.TryDuplicatePackAsync(foreignPackId, CancellationToken.None);

        result.Should().BeNull();
        appService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task TrySoftDeletePackAsync_returns_false_when_pack_is_out_of_scope()
    {
        Guid foreignPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(foreignPackId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPack
                {
                    PolicyPackId = foreignPackId,
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    Name = "foreign-workspace-pack",
                    CurrentVersion = "1.0.0",
                    IsDeleted = false,
                });

        Mock<IPolicyPacksAppService> appService = new(MockBehavior.Strict);

        PolicyPackWorkflowFacade sut = CreateSut(packs.Object, appService: appService.Object);

        bool result = await sut.TrySoftDeletePackAsync(foreignPackId, CancellationToken.None);

        result.Should().BeFalse();
        appService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task TrySimulateBulkAsync_returns_null_when_pack_has_no_versions()
    {
        Guid packId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        PolicyPack pack = CreateInScopePack(packId);

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pack);

        Mock<IPolicyPackVersionRepository> versions = new();
        versions
            .Setup(r => r.GetByPackAndVersionAsync(packId, "1.0.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyPackVersion?)null);
        versions
            .Setup(r => r.ListByPackAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IPolicyPackGovernanceDryRunService> dryRun = new(MockBehavior.Strict);

        PolicyPackWorkflowFacade sut = CreateSut(
            packs.Object,
            versions: versions.Object,
            dryRun: dryRun.Object);

        PolicyPackSimulateBulkSummary? summary = await sut.TrySimulateBulkAsync(
            packId,
            ["run-1"],
            blockCommitOnCritical: null,
            blockCommitMinimumSeverity: null,
            CancellationToken.None);

        summary.Should().BeNull();
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ListVisiblePacksAsync_filters_deleted_and_inactive_platform_packs()
    {
        Guid activePackId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid deletedPackId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid inactivePackId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.ListByScopeAsync(
                CallerScope.TenantId,
                CallerScope.WorkspaceId,
                CallerScope.ProjectId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                CreateInScopePack(activePackId),
                new PolicyPack
                {
                    PolicyPackId = deletedPackId,
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = CallerScope.WorkspaceId,
                    ProjectId = CallerScope.ProjectId,
                    Name = "deleted-pack",
                    CurrentVersion = "1.0.0",
                    IsDeleted = true,
                },
                new PolicyPack
                {
                    PolicyPackId = inactivePackId,
                    TenantId = CallerScope.TenantId,
                    WorkspaceId = CallerScope.WorkspaceId,
                    ProjectId = CallerScope.ProjectId,
                    Name = "inactive-pack",
                    CurrentVersion = "1.0.0",
                    IsDeleted = false,
                },
            ]);

        Mock<IPlatformBundledPolicyPackAvailability> platformAvailability = new();
        platformAvailability
            .Setup(p => p.IsGloballyActiveAsync(It.IsAny<PolicyPack>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        platformAvailability
            .Setup(p => p.IsGloballyActiveAsync(
                It.Is<PolicyPack>(pack => pack.PolicyPackId == inactivePackId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        PolicyPackWorkflowFacade sut = CreateSut(
            packs.Object,
            platformAvailability: platformAvailability.Object);

        IReadOnlyList<PolicyPack> visible = await sut.ListVisiblePacksAsync(CancellationToken.None);

        visible.Should().ContainSingle(pack => pack.PolicyPackId == activePackId);
    }

    private static PolicyPack CreateInScopePack(Guid packId) =>
        new()
        {
            PolicyPackId = packId,
            TenantId = CallerScope.TenantId,
            WorkspaceId = CallerScope.WorkspaceId,
            ProjectId = CallerScope.ProjectId,
            Name = "in-scope-pack",
            CurrentVersion = "1.0.0",
            IsDeleted = false,
        };

    private static PolicyPackWorkflowFacade CreateSut(
        IPolicyPackRepository packRepository,
        IPolicyPackVersionRepository? versions = null,
        IPolicyPacksAppService? appService = null,
        IPolicyPackGovernanceDryRunService? dryRun = null,
        IPlatformBundledPolicyPackAvailability? platformAvailability = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(CallerScope);

        return new PolicyPackWorkflowFacade(
            scopeProvider.Object,
            packRepository,
            versions ?? Mock.Of<IPolicyPackVersionRepository>(),
            Mock.Of<IPolicyPackCatalogRepository>(),
            Mock.Of<ArchLucid.Decisioning.Governance.PolicyPacks.IPolicyPackResolver>(),
            Mock.Of<ArchLucid.Decisioning.Governance.PolicyPacks.IEffectiveGovernanceLoader>(),
            appService ?? Mock.Of<IPolicyPacksAppService>(),
            Mock.Of<IPolicyPackCatalogAdminService>(),
            dryRun ?? Mock.Of<IPolicyPackGovernanceDryRunService>(),
            Mock.Of<IPolicyPackMarkdownExplainService>(),
            Mock.Of<IPolicyPackRuleTemplatesService>(),
            Mock.Of<IPolicyPackContentAuthoringValidationService>(),
            new PolicyPackWorkspaceSelectionService(
                packRepository,
                Mock.Of<IPolicyPackAssignmentRepository>(),
                platformAvailability ?? Mock.Of<IPlatformBundledPolicyPackAvailability>(),
                Mock.Of<IPolicyPackResolverCacheInvalidator>()),
            platformAvailability ?? Mock.Of<IPlatformBundledPolicyPackAvailability>(),
            Mock.Of<IAuditService>());
    }
}
