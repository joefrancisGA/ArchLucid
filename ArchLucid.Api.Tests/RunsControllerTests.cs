using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Models;
using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Planning;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Feedback;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using FluentValidation;
using FluentValidation.Results;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunsControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
    };

    [Fact]
    public async Task CreateRun_returns_bad_request_when_body_null()
    {
        RunsController controller = CreateController();

        IActionResult action = await controller.CreateRun(null, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task DraftRequest_returns_bad_request_when_body_null()
    {
        RunsController controller = CreateController();

        IActionResult action = await controller.DraftRequest(null, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task DraftRequest_returns_bad_request_when_description_too_short()
    {
        RunsController controller = CreateController();

        DraftArchitectureRequestInput input = new() { FreeTextDescription = "too short" };

        IActionResult action = await controller.DraftRequest(input, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task ChatIntake_returns_bad_request_when_raw_text_missing()
    {
        RunsController controller = CreateController();

        IActionResult action = await controller.ChatIntake(new ChatIntakeRequest(), CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task GetRequest_returns_not_found_when_repository_has_no_row()
    {
        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync("missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRequest?)null);

        RunsController controller = CreateController();

        IActionResult action = await controller.GetRequest("missing", requests.Object, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetRequest_returns_architecture_request_when_found()
    {
        ArchitectureRequest request = new() { RequestId = "REQ-100", SystemName = "Core" };

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync("REQ-100", It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ExistsRunForArchitectureRequestInScopeAsync(
                Scope,
                "REQ-100",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        RunsController controller = CreateController(runRepository: runs.Object);

        IActionResult action = await controller.GetRequest("REQ-100", requests.Object, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(request);
    }

    [Fact]
    public async Task GetRequest_returns_not_found_when_request_exists_but_no_run_in_scope()
    {
        ArchitectureRequest request = new() { RequestId = "REQ-100", SystemName = "Core" };

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync("REQ-100", It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ExistsRunForArchitectureRequestInScopeAsync(
                Scope,
                "REQ-100",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        RunsController controller = CreateController(runRepository: runs.Object);

        IActionResult action = await controller.GetRequest("REQ-100", requests.Object, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task ArchiveRequest_returns_not_found_when_request_exists_but_no_run_in_scope()
    {
        ArchitectureRequest request = new() { RequestId = "REQ-100", SystemName = "Core" };

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync("REQ-100", It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.ExistsRunForArchitectureRequestInScopeAsync(
                Scope,
                "REQ-100",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        RunsController controller = CreateController(runRepository: runs.Object);

        IActionResult action = await controller.ArchiveRequest("REQ-100", requests.Object, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        requests.Verify(
            r => r.ArchiveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CloneRequest_returns_not_found_when_source_missing()
    {
        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync("missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRequest?)null);

        RunsController controller = CreateController();

        IActionResult action = await controller.CloneRequest("missing", requests.Object, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task SubmitAgentResult_returns_bad_request_when_body_null()
    {
        RunsController controller = CreateController();

        IActionResult action = await controller.SubmitAgentResult(
            "run-1",
            null,
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task SubmitAgentResult_returns_ok_when_application_service_succeeds()
    {
        Mock<IArchitectureApplicationService> app = new();
        app
            .Setup(s => s.SubmitAgentResultAsync("run-1", It.IsAny<AgentResult>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SubmitResultResult(true, "result-1", null));

        RunsController controller = CreateController(architectureApplicationService: app.Object);

        SubmitAgentResultRequest body = new()
        {
            Result = new AgentResult { AgentType = AgentType.Topology }
        };

        IActionResult action = await controller.SubmitAgentResult("run-1", body, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateRun_create_architecture_calls_synthesis_kernel_without_review_create()
    {
        Mock<IArchitectureSynthesisKernel> kernel = new();
        kernel
            .Setup(k => k.GenerateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CreateRunIdempotencyState?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureSynthesisGenerateResult
            {
                RunId = Guid.NewGuid().ToString("N"),
                PackageOrigin = ArchitecturePackageOrigin.Created
            });

        Mock<IArchitectureRunCreateOrchestrator> create = new();
        RunsController controller = CreateController(createOrchestrator: create.Object, synthesisKernel: kernel.Object);

        ArchitectureRequest request = new()
        {
            RequestId = "req-create-arch",
            Description = new string('x', 20),
            SystemName = "CreatedArch",
            WorkflowIntent = ArchitectureWorkflowIntent.CreateArchitecture
        };

        IActionResult action = await controller.CreateRun(request, CancellationToken.None);

        CreatedAtActionResult created = action.Should().BeOfType<CreatedAtActionResult>().Subject;
        created.StatusCode.Should().Be(StatusCodes.Status201Created);
        kernel.Verify(
            k => k.GenerateAsync(
                It.Is<ArchitectureRequest>(r => r.RequestId == "req-create-arch"),
                It.IsAny<CreateRunIdempotencyState?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
        create.Verify(
            c => c.CreateRunAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CreateRunIdempotencyState?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static RunsController CreateController(
        IArchitectureApplicationService? architectureApplicationService = null,
        IArchitectureRequestDraftService? draftService = null,
        IArchitectureRunCreateOrchestrator? createOrchestrator = null,
        IArchitectureSynthesisKernel? synthesisKernel = null,
        IRunRepository? runRepository = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("operator@test");

        Mock<IValidator<ArchitectureRequest>> validator = new();
        validator
            .Setup(v => v.ValidateAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult());

        return new RunsController(
            createOrchestrator ?? Mock.Of<IArchitectureRunCreateOrchestrator>(),
            Mock.Of<IArchitectureRunBatchCreateOrchestrator>(),
            Mock.Of<IArchitectureRunExecuteOrchestrator>(),
            Mock.Of<IArchitectureRunCommitOrchestrator>(),
            architectureApplicationService ?? Mock.Of<IArchitectureApplicationService>(),
            draftService ?? Mock.Of<IArchitectureRequestDraftService>(),
            Mock.Of<IChatIntakeParserService>(),
            Mock.Of<IConnectorIntakeParserService>(),
            validator.Object,
            Mock.Of<IReplayRunService>(),
            scopeProvider.Object,
            actor.Object,
            Mock.Of<IAuditService>(),
            Mock.Of<ICommitSponsorEmailNotifier>(),
            Mock.Of<ICommitRunIdempotencyCoordinator>(),
            runRepository ?? Mock.Of<IRunRepository>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IFindingFeedbackRepository>(),
            synthesisKernel ?? Mock.Of<IArchitectureSynthesisKernel>(),
            NullLogger<RunsController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }
}
