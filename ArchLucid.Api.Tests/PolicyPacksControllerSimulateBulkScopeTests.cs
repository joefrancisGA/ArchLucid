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
///     Scope binding for <c>POST /v1/policy-packs/{id}/simulate-bulk</c> (tenant/workspace/project vs pack row).
/// </summary>
[Trait("Category", "Unit")]
public sealed class PolicyPacksControllerSimulateBulkScopeTests
{
    private static readonly ScopeContext CallerScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task SimulateBulk_returns_not_found_when_pack_belongs_to_another_tenant()
    {
        Guid foreignPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        PolicyPack foreignPack = new()
        {
            PolicyPackId = foreignPackId,
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Name = "foreign-pack",
            Description = "owned elsewhere",
            CurrentVersion = "1.0.0",
            IsDeleted = false,
        };

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(foreignPackId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(foreignPack);

        Mock<IPolicyPackGovernanceDryRunService> dryRun = new(MockBehavior.Strict);

        PolicyPacksController sut = CreateController(packs.Object, dryRun);

        PolicyPackSimulateBulkRequest request = new() { RunIds = ["run-1"] };

        IActionResult result = await sut.SimulateBulk(foreignPackId, request, CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        dryRun.Verify(
            s => s.EvaluateAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<bool?>(),
                It.IsAny<int?>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task SimulateBulk_evaluates_runs_when_pack_is_in_caller_scope()
    {
        Guid packId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        PolicyPack pack = new()
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

        PolicyPackVersion version = new()
        {
            PolicyPackId = packId,
            Version = "1.0.0",
            ContentJson = """{"complianceRuleIds":[]}""",
        };

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pack);

        Mock<IPolicyPackVersionRepository> versions = new();
        versions
            .Setup(r => r.GetByPackAndVersionAsync(packId, "1.0.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(version);

        PolicyPackGovernanceDryRunResult dryRunResult = new()
        {
            ResolvedRunId = "run-1",
            GateResult = PreCommitGateResult.Allowed(),
        };

        Mock<IPolicyPackGovernanceDryRunService> dryRun = new();
        dryRun
            .Setup(s => s.EvaluateAsync(
                version.ContentJson,
                "run-1",
                null,
                It.IsAny<bool?>(),
                It.IsAny<int?>(),
                packId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(dryRunResult);

        PolicyPacksController sut = CreateController(packs.Object, dryRun, versions.Object);

        PolicyPackSimulateBulkRequest request = new() { RunIds = ["run-1"] };

        IActionResult result = await sut.SimulateBulk(packId, request, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeOfType<PolicyPackSimulateBulkSummaryResponse>();
    }

    private static PolicyPacksController CreateController(
        IPolicyPackRepository packRepository,
        Mock<IPolicyPackGovernanceDryRunService> dryRun,
        IPolicyPackVersionRepository? versionRepository = null)
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
            versionRepository ?? Mock.Of<IPolicyPackVersionRepository>(),
            Mock.Of<IPolicyPackCatalogRepository>(),
            Mock.Of<ArchLucid.Decisioning.Governance.PolicyPacks.IPolicyPackResolver>(),
            Mock.Of<ArchLucid.Decisioning.Governance.PolicyPacks.IEffectiveGovernanceLoader>(),
            Mock.Of<IPolicyPacksAppService>(),
            Mock.Of<IPolicyPackCatalogAdminService>(),
            dryRun.Object,
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
