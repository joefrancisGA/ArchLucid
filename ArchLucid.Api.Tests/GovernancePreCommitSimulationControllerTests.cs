using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
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
    public async Task GetChecklist_returns_not_found_with_trimmed_run_id_when_padded_valid_guid_out_of_scope()
    {
        Guid foreignRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string paddedRunId = $"  {foreignRunId:D}  ";

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(Scope, foreignRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<IPreFinalizeChecklistService> checklist = new(MockBehavior.Strict);

        GovernancePreCommitSimulationController sut = CreateController(
            runRepository: runs.Object,
            checklistService: checklist.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetChecklistAsync(paddedRunId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            notFound.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Detail.Should().Be($"Run '{foreignRunId:D}' was not found.");
        checklist.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetChecklist_returns_validation_failed_with_trimmed_run_id_in_detail_when_malformed_id_is_padded()
    {
        Mock<IPreFinalizeChecklistService> checklist = new(MockBehavior.Strict);

        GovernancePreCommitSimulationController sut = CreateController(checklistService: checklist.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetChecklistAsync("  not-a-guid  ", CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            badRequest.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
        problem.Detail.Should().Be("Run ID 'not-a-guid' is not valid.");
        checklist.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetChecklist_returns_validation_failed_when_run_id_is_not_valid()
    {
        Mock<IPreFinalizeChecklistService> checklist = new(MockBehavior.Strict);

        GovernancePreCommitSimulationController sut = CreateController(checklistService: checklist.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetChecklistAsync("not-a-guid", CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            badRequest.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
        checklist.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetChecklist_returns_bad_request_when_run_id_is_empty_guid()
    {
        Mock<IPreFinalizeChecklistService> checklist = new(MockBehavior.Strict);

        GovernancePreCommitSimulationController sut = CreateController(checklistService: checklist.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetChecklistAsync(Guid.Empty.ToString("D"), CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        checklist.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetChecklist_returns_bad_request_when_run_id_is_not_a_guid()
    {
        Mock<IPreFinalizeChecklistService> checklist = new(MockBehavior.Strict);

        GovernancePreCommitSimulationController sut = CreateController(checklistService: checklist.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetChecklistAsync("not-a-guid", CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        checklist.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetChecklist_returns_bad_request_when_run_id_exceeds_max_length()
    {
        string overlongRunId = new string('r', GovernanceRequestValidationRules.RunIdMaxLength + 1);
        Mock<IPreFinalizeChecklistService> checklist = new(MockBehavior.Strict);
        Mock<IRunRepository> runs = new(MockBehavior.Strict);

        GovernancePreCommitSimulationController sut = CreateController(
            runRepository: runs.Object,
            checklistService: checklist.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetChecklistAsync(overlongRunId, CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        runs.VerifyNoOtherCalls();
        checklist.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Simulate_returns_bad_request_when_run_id_exceeds_max_length()
    {
        string overlongRunId = new string('r', GovernanceRequestValidationRules.RunIdMaxLength + 1);
        Mock<IPreCommitGovernanceGate> gate = new(MockBehavior.Strict);
        Mock<IRunRepository> runs = new(MockBehavior.Strict);

        GovernancePreCommitSimulationController sut = CreateController(
            gate: gate.Object,
            runRepository: runs.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SimulateAsync(
            new PreCommitSyntheticSimulationRequest
            {
                RunId = overlongRunId,
                SyntheticSeverity = FindingSeverity.Critical,
                SyntheticCount = 1,
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        runs.VerifyNoOtherCalls();
        gate.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Simulate_returns_bad_request_when_run_id_is_not_a_guid()
    {
        Mock<IPreCommitGovernanceGate> gate = new(MockBehavior.Strict);

        GovernancePreCommitSimulationController sut = CreateController(gate: gate.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SimulateAsync(
            new PreCommitSyntheticSimulationRequest
            {
                RunId = "not-a-guid",
                SyntheticSeverity = FindingSeverity.Critical,
                SyntheticCount = 1,
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        gate.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Simulate_returns_bad_request_when_synthetic_count_exceeds_five_hundred()
    {
        Mock<IPreCommitGovernanceGate> gate = new(MockBehavior.Strict);

        GovernancePreCommitSimulationController sut = CreateController(gate: gate.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SimulateAsync(
            new PreCommitSyntheticSimulationRequest
            {
                RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D"),
                SyntheticSeverity = FindingSeverity.Critical,
                SyntheticCount = 501,
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        gate.VerifyNoOtherCalls();
    }

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
    public async Task GetChecklist_returns_not_found_when_workspace_missing()
    {
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Scope.TenantId,
            WorkspaceId = foreignWorkspaceId,
            ProjectId = Scope.ProjectId,
        });

        Mock<IPreFinalizeChecklistService> checklist = new(MockBehavior.Strict);
        Mock<IRunRepository> runs = new(MockBehavior.Strict);

        GovernancePreCommitSimulationController sut = CreateController(
            scopeProvider: scopeProvider.Object,
            tenantRepository: TenantExistsRepository(),
            checklistService: checklist.Object,
            runRepository: runs.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.GetChecklistAsync(runId.ToString("D"), CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        checklist.VerifyNoOtherCalls();
        runs.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Simulate_returns_not_found_when_workspace_missing()
    {
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Scope.TenantId,
            WorkspaceId = foreignWorkspaceId,
            ProjectId = Scope.ProjectId,
        });

        Mock<IPreCommitGovernanceGate> gate = new(MockBehavior.Strict);
        Mock<IRunRepository> runs = new(MockBehavior.Strict);

        GovernancePreCommitSimulationController sut = CreateController(
            scopeProvider: scopeProvider.Object,
            gate: gate.Object,
            tenantRepository: TenantExistsRepository(),
            runRepository: runs.Object);
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
        gate.VerifyNoOtherCalls();
        runs.VerifyNoOtherCalls();
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
    public async Task Simulate_returns_bad_request_when_synthetic_severity_is_unrecognized_and_tenant_missing()
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
                SyntheticSeverity = (FindingSeverity)99,
                SyntheticCount = 1,
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        gate.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Simulate_returns_validation_failed_with_trimmed_run_id_in_detail_when_malformed_id_is_padded()
    {
        Mock<IPreCommitGovernanceGate> gate = new(MockBehavior.Strict);

        GovernancePreCommitSimulationController sut = CreateController(gate: gate.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SimulateAsync(
            new PreCommitSyntheticSimulationRequest
            {
                RunId = "  not-a-guid  ",
                SyntheticSeverity = FindingSeverity.Critical,
                SyntheticCount = 1,
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            badRequest.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
        problem.Detail.Should().Be("Run ID 'not-a-guid' is not valid.");
        gate.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Simulate_returns_validation_failed_when_run_id_is_not_valid()
    {
        Mock<IPreCommitGovernanceGate> gate = new(MockBehavior.Strict);

        GovernancePreCommitSimulationController sut = CreateController(gate: gate.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SimulateAsync(
            new PreCommitSyntheticSimulationRequest
            {
                RunId = "not-a-guid",
                SyntheticSeverity = FindingSeverity.Critical,
                SyntheticCount = 1,
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            badRequest.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
        gate.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Simulate_returns_bad_request_when_run_id_is_empty_guid()
    {
        Mock<IPreCommitGovernanceGate> gate = new(MockBehavior.Strict);

        GovernancePreCommitSimulationController sut = CreateController(gate: gate.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SimulateAsync(
            new PreCommitSyntheticSimulationRequest
            {
                RunId = Guid.Empty.ToString("D"),
                SyntheticSeverity = FindingSeverity.Critical,
                SyntheticCount = 1,
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        gate.VerifyNoOtherCalls();
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

    [Fact]
    public async Task Simulate_returns_bad_request_when_synthetic_count_is_negative()
    {
        Mock<IPreCommitGovernanceGate> gate = new(MockBehavior.Strict);

        GovernancePreCommitSimulationController sut = CreateController(gate: gate.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.SimulateAsync(
            new PreCommitSyntheticSimulationRequest
            {
                RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D"),
                SyntheticSeverity = FindingSeverity.Critical,
                SyntheticCount = -1,
            },
            CancellationToken.None);

        ObjectResult badRequest = result.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        gate.VerifyNoOtherCalls();
    }

    private static ITenantRepository TenantExistsRepository()
    {
        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });
        tenants
            .Setup(repository => repository.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        return tenants.Object;
    }

    private static ITenantRepository TenantMissingRepository() =>
        Mock.Of<ITenantRepository>(repository => repository.GetByIdAsync(
            Scope.TenantId,
            It.IsAny<CancellationToken>()) == Task.FromResult<TenantRecord?>(null));

    private static GovernancePreCommitSimulationController CreateController(
        IPreCommitGovernanceGate? gate = null,
        IRunRepository? runRepository = null,
        IPreFinalizeChecklistService? checklistService = null,
        ITenantRepository? tenantRepository = null,
        IScopeContextProvider? scopeProvider = null)
    {
        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock.Setup(s => s.GetCurrentScope()).Returns(Scope);

        return new GovernancePreCommitSimulationController(
            gate ?? Mock.Of<IPreCommitGovernanceGate>(),
            checklistService ?? Mock.Of<IPreFinalizeChecklistService>(),
            Mock.Of<IAuditService>(),
            runRepository ?? Mock.Of<IRunRepository>(),
            scopeProvider ?? scopeMock.Object,
            tenantRepository ?? TenantExistsRepository());
    }
}
