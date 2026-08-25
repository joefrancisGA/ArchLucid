using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Models;
using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Application.Planning;
using ArchLucid.Application.Operations;
using ArchLucid.Application.Planning.AdvisoryDraft;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Query;
using ArchLucid.Contracts.Operations;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
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

using MvcProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

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
    public async Task RewriteArchitectureOverview_returns_rewritten_overview_when_valid()
    {
        Mock<IArchitectureOverviewRewriteService> rewriteService = new();
        rewriteService
            .Setup(s => s.RewriteAsync(It.IsAny<RewriteArchitectureOverviewInput>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RewriteArchitectureOverviewResponse
            {
                RewrittenOverview = "Grounded overview with EU data residency.",
            });

        RunsController controller = CreateController(overviewRewriteService: rewriteService.Object);

        RewriteArchitectureOverviewInput input = new()
        {
            CurrentOverview = "Tenant migration platform with private networking and EU residency goals.",
            StructuredBrief = new ArchitectureDraftStructuredBrief
            {
                ConfirmedConstraints = ["EU data residency"],
            },
        };

        IActionResult action = await controller.RewriteArchitectureOverview(input, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        RewriteArchitectureOverviewResponse response =
            ok.Value.Should().BeOfType<RewriteArchitectureOverviewResponse>().Subject;

        response.RewrittenOverview.Should().Contain("EU data residency");
    }

    [Fact]
    public async Task ExplainStructuredBriefSuggestion_returns_bad_request_when_body_null()
    {
        RunsController controller = CreateController();

        IActionResult action = await controller.ExplainStructuredBriefSuggestion(null, CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task ExplainStructuredBriefSuggestion_returns_explanation_when_valid()
    {
        Mock<IStructuredBriefSuggestionExplainService> explainService = new();
        explainService
            .Setup(s => s.ExplainAsync(It.IsAny<ExplainStructuredBriefSuggestionInput>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ExplainStructuredBriefSuggestionResponse
            {
                Explanation = "Your overview mentioned EU customers.",
            });

        RunsController controller = CreateController(explainService: explainService.Object);

        ExplainStructuredBriefSuggestionInput input = new()
        {
            SourceText = "Tenant migration platform with private networking and EU residency goals.",
            SuggestionKind = StructuredBriefSuggestionKind.Constraint,
            SuggestionText = "EU data residency",
        };

        IActionResult action = await controller.ExplainStructuredBriefSuggestion(input, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ExplainStructuredBriefSuggestionResponse response =
            ok.Value.Should().BeOfType<ExplainStructuredBriefSuggestionResponse>().Subject;

        response.Explanation.Should().Contain("EU customers");
    }

    [Fact]
    public async Task RephraseClarificationAnswers_returns_rephrased_answers_when_valid()
    {
        Mock<IClarificationAnswerRephraseService> rephraseService = new();
        rephraseService
            .Setup(s => s.RephraseAsync(It.IsAny<RephraseClarificationAnswersInput>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RephraseClarificationAnswersResponse
            {
                RephrasedAnswers = new Dictionary<string, string>
                {
                    ["l0.actor.additional-kinds"] =
                        "Yes — partner integrations and service accounts also call the API.",
                },
            });

        RunsController controller = CreateController(clarificationRephraseService: rephraseService.Object);

        RephraseClarificationAnswersInput input = new()
        {
            Items =
            [
                new ClarificationAnswerRephraseItem
                {
                    QuestionKey = "l0.actor.additional-kinds",
                    QuestionPrompt =
                        "Are there other kinds of users (human or machine) that interact with this system besides those already identified?",
                    ExtractedAnswer = "Partner integrations and service accounts also call the API.",
                },
            ],
        };

        IActionResult action = await controller.RephraseClarificationAnswers(input, CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        RephraseClarificationAnswersResponse response =
            ok.Value.Should().BeOfType<RephraseClarificationAnswersResponse>().Subject;

        response.RephrasedAnswers["l0.actor.additional-kinds"].Should().Contain("service accounts");
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
    public async Task CreateRun_create_architecture_calls_command_service_synthesis_path()
    {
        Mock<IRunLifecycleCommandService> commands = new();
        commands
            .Setup(s => s.CreateRunAsync(
                Scope,
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CreateRunCommandResult
            {
                SynthesisResult = new ArchitectureSynthesisGenerateResult
                {
                    RunId = Guid.NewGuid().ToString("N"),
                    PackageOrigin = ArchitecturePackageOrigin.Created
                }
            });

        RunsController controller = CreateController(runLifecycleCommandService: commands.Object);

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
        commands.Verify(
            s => s.CreateRunAsync(
                Scope,
                It.Is<ArchitectureRequest>(r => r.RequestId == "req-create-arch"),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task PinRun_returns_not_found_for_invalid_run_id_like_GetRun()
    {
        RunsController controller = CreateController();

        IActionResult action = await controller.PinRun("not-a-guid", null, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public void GetDraftRequestAsyncResult_failed_operation_returns_422_not_400_validation()
    {
        InMemoryAdvisoryDraftOperationStore store = new();
        AdvisoryDraftOperationRecord record = store.CreatePending(Scope);
        string opaqueOperationId = OperationIdCodec.ForDraft(record.OperationId);
        store.MarkFailed(opaqueOperationId, "LLM timeout");

        RunsController controller = CreateController();

        IActionResult action = controller.GetDraftRequestAsyncResult(record.OperationId, store);

        ObjectResult problem = action.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status422UnprocessableEntity);

        MvcProblemDetails details = problem.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        details.Type.Should().Be(ProblemTypes.BusinessRuleViolation);
        details.Detail.Should().Be("LLM timeout");
    }

    private static RunsController CreateController(
        IArchitectureApplicationService? architectureApplicationService = null,
        IArchitectureRequestDraftService? draftService = null,
        IArchitectureOverviewRewriteService? overviewRewriteService = null,
        IClarificationAnswerRephraseService? clarificationRephraseService = null,
        IStructuredBriefSuggestionExplainService? explainService = null,
        IRunLifecycleCommandService? runLifecycleCommandService = null,
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
            runLifecycleCommandService ?? Mock.Of<IRunLifecycleCommandService>(),
            architectureApplicationService ?? Mock.Of<IArchitectureApplicationService>(),
            draftService ?? Mock.Of<IArchitectureRequestDraftService>(),
            overviewRewriteService ?? Mock.Of<IArchitectureOverviewRewriteService>(),
            clarificationRephraseService ?? Mock.Of<IClarificationAnswerRephraseService>(),
            explainService ?? Mock.Of<IStructuredBriefSuggestionExplainService>(),
            Mock.Of<IChatIntakeParserService>(),
            Mock.Of<IConnectorIntakeParserService>(),
            validator.Object,
            scopeProvider.Object,
            actor.Object,
            Mock.Of<IAuditService>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IFindingFeedbackRepository>(),
            runRepository ?? Mock.Of<IRunRepository>(),
            NullLogger<RunsController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
    }
}
