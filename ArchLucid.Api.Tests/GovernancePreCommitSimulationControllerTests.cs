using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class GovernancePreCommitSimulationControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task GetChecklist_returns_not_found_for_out_of_scope_run_id()
    {
        Guid foreignRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string runId = foreignRunId.ToString("D");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<IPreFinalizeChecklistService> checklist = new(MockBehavior.Strict);

        GovernancePreCommitSimulationController sut = CreateController(
            runRepository: runs.Object,
            checklistService: checklist.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetChecklistAsync(runId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        checklist.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetChecklist_returns_not_found_when_tenant_missing()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPreFinalizeChecklistService> checklist = new(MockBehavior.Strict);

        GovernancePreCommitSimulationController sut = CreateController(
            tenantRepository: TenantMissingRepository(),
            checklistService: checklist.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetChecklistAsync(runId.ToString("D"), CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        checklist.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Simulate_returns_not_found_when_tenant_missing()
    {
        Mock<IPreCommitGovernanceGate> gate = new(MockBehavior.Strict);

        GovernancePreCommitSimulationController sut = CreateController(
            gate: gate.Object,
            tenantRepository: TenantMissingRepository());
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SimulateAsync(
            new PreCommitSyntheticSimulationRequest
            {
                RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D"),
                SyntheticSeverity = FindingSeverity.Critical,
                SyntheticCount = 1,
            },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Simulate_returns_not_found_for_out_of_scope_run_id()
    {
        Guid foreignRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string runId = foreignRunId.ToString("D");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<IPreCommitGovernanceGate> gate = new(MockBehavior.Strict);

        GovernancePreCommitSimulationController sut = CreateController(
            gate: gate.Object,
            runRepository: runs.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SimulateAsync(
            new PreCommitSyntheticSimulationRequest
            {
                RunId = runId,
                SyntheticSeverity = FindingSeverity.Critical,
                SyntheticCount = 1,
            },
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        gate.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Simulate_returns_bad_request_when_run_id_is_whitespace()
    {
        Mock<IPreCommitGovernanceGate> gate = new(MockBehavior.Strict);

        GovernancePreCommitSimulationController sut = CreateController(gate: gate.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SimulateAsync(
            new PreCommitSyntheticSimulationRequest
            {
                RunId = "  ",
                SyntheticSeverity = FindingSeverity.Critical,
                SyntheticCount = 1,
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        gate.VerifyNoOtherCalls();
    }

    private static ITenantRepository TenantMissingRepository() =>
        Mock.Of<ITenantRepository>(repository => repository.GetByIdAsync(
            Scope.TenantId,
            It.IsAny<CancellationToken>()) == Task.FromResult<TenantRecord?>(null));

    private static GovernancePreCommitSimulationController CreateController(
        IPreCommitGovernanceGate? gate = null,
        IRunRepository? runRepository = null,
        IPreFinalizeChecklistService? checklistService = null,
        ITenantRepository? tenantRepository = null)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(Scope);

        return new GovernancePreCommitSimulationController(
            gate ?? Mock.Of<IPreCommitGovernanceGate>(),
            checklistService ?? Mock.Of<IPreFinalizeChecklistService>(),
            Mock.Of<IAuditService>(),
            runRepository ?? Mock.Of<IRunRepository>(),
            scope.Object,
            tenantRepository ?? Mock.Of<ITenantRepository>(repository => repository.GetByIdAsync(
                Scope.TenantId,
                It.IsAny<CancellationToken>()) == Task.FromResult<TenantRecord?>(new TenantRecord { Id = Scope.TenantId, Name = "contoso" })));
    }
}
