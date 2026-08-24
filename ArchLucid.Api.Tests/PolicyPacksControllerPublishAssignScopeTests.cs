using ArchLucid.AgentRuntime;
using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Host.Core.Services;
using ArchLucid.Host.Core.Services.Governance;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Scope binding for policy pack publish and assign mutations (tenant/workspace/project vs pack row).
/// </summary>
[Trait("Category", "Unit")]
public sealed class PolicyPacksControllerPublishAssignScopeTests
{
    private static readonly ScopeContext CallerScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task Publish_returns_not_found_when_pack_belongs_to_another_tenant()
    {
        Guid foreignPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        PolicyPack foreignPack = CreateForeignPack(foreignPackId);

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(foreignPackId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(foreignPack);

        Mock<IPolicyPacksAppService> appService = new(MockBehavior.Strict);

        PolicyPacksController sut = CreateController(packs.Object, appService);

        PublishPolicyPackVersionRequest request = new()
        {
            Version = "2.0.0",
            ContentJson = """{"complianceRuleIds":[]}""",
        };

        IActionResult result = await sut.Publish(foreignPackId, request, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        appService.Verify(
            s => s.PublishVersionAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Assign_returns_not_found_when_pack_belongs_to_another_tenant()
    {
        Guid foreignPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        PolicyPack foreignPack = CreateForeignPack(foreignPackId);

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(foreignPackId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(foreignPack);

        Mock<IPolicyPacksAppService> appService = new(MockBehavior.Strict);

        PolicyPacksController sut = CreateController(packs.Object, appService);

        AssignPolicyPackRequest request = new()
        {
            Version = "1.0.0",
            ScopeLevel = "Project",
            IsPinned = false,
        };

        IActionResult result = await sut.Assign(foreignPackId, request, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        appService.Verify(
            s => s.TryAssignAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Assign_creates_assignment_when_pack_is_in_caller_scope()
    {
        Guid packId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        PolicyPack pack = CreateInScopePack(packId);

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pack);

        PolicyPackAssignment assignment = new()
        {
            AssignmentId = Guid.NewGuid(),
            TenantId = CallerScope.TenantId,
            WorkspaceId = CallerScope.WorkspaceId,
            ProjectId = CallerScope.ProjectId,
            PolicyPackId = packId,
            PolicyPackVersion = "1.0.0",
        };

        Mock<IPolicyPacksAppService> appService = new();
        appService
            .Setup(s => s.TryAssignAsync(
                CallerScope.TenantId,
                CallerScope.WorkspaceId,
                CallerScope.ProjectId,
                packId,
                "1.0.0",
                "Project",
                false,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(assignment);

        PolicyPacksController sut = CreateController(packs.Object, appService);

        AssignPolicyPackRequest request = new()
        {
            Version = "1.0.0",
            ScopeLevel = "Project",
            IsPinned = false,
        };

        IActionResult result = await sut.Assign(packId, request, CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
    }

    private static PolicyPack CreateForeignPack(Guid packId) =>
        new()
        {
            PolicyPackId = packId,
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Name = "foreign-pack",
            Description = "owned elsewhere",
            CurrentVersion = "1.0.0",
            IsDeleted = false,
        };

    private static PolicyPack CreateInScopePack(Guid packId) =>
        new()
        {
            PolicyPackId = packId,
            TenantId = CallerScope.TenantId,
            WorkspaceId = CallerScope.WorkspaceId,
            ProjectId = CallerScope.ProjectId,
            Name = "in-scope-pack",
            Description = "owned here",
            CurrentVersion = "1.0.0",
            IsDeleted = false,
        };

    private static PolicyPacksController CreateController(
        IPolicyPackRepository packRepository,
        Mock<IPolicyPacksAppService> appService)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(CallerScope);

        PolicyPackWorkspaceSelectionService workspaceSelection = new(
            packRepository,
            Mock.Of<IPolicyPackAssignmentRepository>(),
            Mock.Of<IPlatformBundledPolicyPackAvailability>(),
            Mock.Of<IPolicyPackResolverCacheInvalidator>());

        PolicyPackMarkdownExplainService explainService = new(
            Mock.Of<IAgentCompletionClient>(),
            NullLogger<PolicyPackMarkdownExplainService>.Instance);

        PolicyPacksController controller = new(
            scopeProvider.Object,
            packRepository,
            Mock.Of<IPolicyPackVersionRepository>(),
            Mock.Of<IPolicyPackCatalogRepository>(),
            Mock.Of<ArchLucid.Decisioning.Governance.PolicyPacks.IPolicyPackResolver>(),
            Mock.Of<ArchLucid.Decisioning.Governance.PolicyPacks.IEffectiveGovernanceLoader>(),
            appService.Object,
            Mock.Of<IPolicyPackCatalogAdminService>(),
            Mock.Of<IPolicyPackGovernanceDryRunService>(),
            explainService,
            Mock.Of<IPolicyPackRuleTemplatesService>(),
            Mock.Of<IPolicyPackContentAuthoringValidationService>(),
            new CreatePolicyPackRequestValidator(),
            new PublishPolicyPackVersionRequestValidator(),
            new AssignPolicyPackRequestValidator(),
            workspaceSelection,
            Mock.Of<IPlatformBundledPolicyPackAvailability>(),
            Mock.Of<IAuditService>());

        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        return controller;
    }
}
