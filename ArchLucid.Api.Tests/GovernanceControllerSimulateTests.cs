using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class GovernanceControllerSimulateTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task Simulate_returns_bad_request_when_run_id_missing()
    {
        GovernanceController sut = CreateController();

        IActionResult action = await sut.Simulate(
            new PolicyPackSimulateRequest
            {
                RunId = null!,
                Content = new(),
            },
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task Simulate_returns_not_found_when_tenant_missing()
    {
        Mock<IPolicyPackGovernanceDryRunService> dryRun = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            governanceDryRunService: dryRun.Object,
            tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.Simulate(
            new PolicyPackSimulateRequest
            {
                RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D"),
                Content = new(),
            },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DryRunProposedPolicyPack_returns_not_found_when_tenant_missing()
    {
        Mock<IPolicyPackGovernanceDryRunService> dryRun = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            governanceDryRunService: dryRun.Object,
            tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.DryRunProposedPolicyPack(
            new PolicyPackGovernanceDryRunRequest
            {
                PolicyPackContentJson = "{}",
                TargetRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D"),
            },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DryRunPolicyPack_returns_bad_request_when_all_evaluate_against_run_ids_are_whitespace()
    {
        Mock<IPolicyPackDryRunService> dryRun = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(dryRunService: dryRun.Object);

        IActionResult action = await sut.DryRunPolicyPack(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            new PolicyPackDryRunRequest { EvaluateAgainstRunIds = ["", "  "] },
            pageSize: null,
            page: null,
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DryRunPolicyPack_returns_not_found_when_tenant_missing()
    {
        Mock<IPolicyPackDryRunService> dryRun = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            dryRunService: dryRun.Object,
            tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.DryRunPolicyPack(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            new PolicyPackDryRunRequest
            {
                EvaluateAgainstRunIds = [Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D")],
            },
            pageSize: null,
            page: null,
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        dryRun.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task DraftPolicyPackRule_returns_not_found_when_tenant_missing()
    {
        Mock<IPolicyPackDraftService> draft = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            draftService: draft.Object,
            tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.DraftPolicyPackRule(
            new DraftPolicyPackInput { FreeTextIntent = "Require encryption on all storage accounts." },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        draft.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GeneratePolicyPack_returns_not_found_when_tenant_missing()
    {
        Mock<IPolicyPackGeneratorService> generator = new(MockBehavior.Strict);

        GovernanceController sut = CreateController(
            generatorService: generator.Object,
            tenantRepository: TenantMissingRepository());

        IActionResult action = await sut.GeneratePolicyPack(
            new GeneratePolicyPackRequest { Prompt = "Draft a baseline security policy pack for retail workloads." },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        generator.VerifyNoOtherCalls();
    }

    private static ITenantRepository TenantMissingRepository() =>
        Mock.Of<ITenantRepository>(repository => repository.GetByIdAsync(
            Scope.TenantId,
            It.IsAny<CancellationToken>()) == Task.FromResult<TenantRecord?>(null));

    private static GovernanceController CreateController(
        IPolicyPackGovernanceDryRunService? governanceDryRunService = null,
        IPolicyPackDryRunService? dryRunService = null,
        IPolicyPackDraftService? draftService = null,
        IPolicyPackGeneratorService? generatorService = null,
        ITenantRepository? tenantRepository = null)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);

        GovernanceController controller = new(
            Mock.Of<IGovernanceWorkflowService>(),
            Mock.Of<IGovernanceApprovalRequestRepository>(),
            Mock.Of<IGovernancePromotionRecordRepository>(),
            Mock.Of<IGovernanceEnvironmentActivationRepository>(),
            Mock.Of<IActorContext>(),
            scope.Object,
            Mock.Of<ArchLucid.Persistence.Interfaces.IRunRepository>(),
            Mock.Of<IGovernanceDashboardService>(),
            Mock.Of<IGovernanceLineageService>(),
            Mock.Of<IGovernanceRationaleService>(),
            Mock.Of<IComplianceDriftTrendService>(),
            dryRunService ?? Mock.Of<IPolicyPackDryRunService>(),
            governanceDryRunService ?? Mock.Of<IPolicyPackGovernanceDryRunService>(),
            Mock.Of<IPolicyPackSchemaKeysService>(),
            Mock.Of<Core.Audit.IAuditService>(),
            draftService ?? Mock.Of<IPolicyPackDraftService>(),
            generatorService ?? Mock.Of<IPolicyPackGeneratorService>(),
            tenantRepository ?? Mock.Of<ITenantRepository>(repository => repository.GetByIdAsync(
                Scope.TenantId,
                It.IsAny<CancellationToken>()) == Task.FromResult<TenantRecord?>(new TenantRecord { Id = Scope.TenantId, Name = "contoso" })),
            NullLogger<GovernanceController>.Instance);

        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        return controller;
    }
}
