using System.Security.Claims;

using ArchLucid.Api.Controllers.Architecture;
using ArchLucid.Api.Support;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Exports;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DraftRequestsControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid DraftId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private readonly Mock<IScopeContextProvider> _scopeProvider = new();
    private readonly Mock<IActorContext> _actorContext = new();
    private readonly Mock<IDraftRequestService> _service = new();
    private readonly Mock<IDraftIntakeReasoningService> _reasoning = new();
    private readonly Mock<IDecisionReceiptService> _decisionReceipt = new();
    private readonly Mock<IAuditService> _audit = new();
    private readonly Mock<IArchitectureWorkLeaseService> _workLease = new();

    public DraftRequestsControllerTests()
    {
        _scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);
        _actorContext.Setup(static a => a.GetActor()).Returns("op-display");
        _actorContext.Setup(static a => a.GetActorId()).Returns("op-id");
    }

    private DraftRequestsController BuildSut(
        IArchitectureShareAccessGate? shareGate = null,
        IRunDetailQueryService? runDetails = null,
        IAuthorityQueryService? authorityQuery = null,
        IDraftRequestRepository? draftRepository = null) =>
        new(
            _scopeProvider.Object,
            _actorContext.Object,
            _service.Object,
            _reasoning.Object,
            _decisionReceipt.Object,
            _audit.Object,
            _workLease.Object,
            authorityQuery ?? SealedManifestHashTestSupport.CreateAuthorityQueryServiceForAnyRun(),
            SealedManifestHashTestSupport.CreateManifestHashService(),
            runDetails ?? SealedManifestHashTestSupport.CreateRunDetailQueryServiceWithoutCommittedRuns(),
            Mock.Of<IPriorPackageSemanticMergeService>(),
            shareGate ?? Mock.Of<IArchitectureShareAccessGate>(),
            draftRepository ?? BuildOwnedDraftRepository())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity("Test")) },
            },
        };

    private static readonly DateTime AuthorizedRevision = new(2026, 11, 25, 11, 0, 0, DateTimeKind.Utc);

    private static DraftRequestAccessMetadata OwnedDraftFacts() => new(
        DraftId, Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId, null, "op-id", null, null, AuthorizedRevision);

    private static IDraftRequestRepository BuildOwnedDraftRepository()
    {
        Mock<IDraftRequestRepository> repository = new(MockBehavior.Strict);
        repository.Setup(r => r.GetAccessMetadataAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId, DraftId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(OwnedDraftFacts());

        return repository.Object;
    }

    [Theory]
    [InlineData("list")]
    [InlineData("answer")]
    [InlineData("skip")]
    public async Task Questions_hide_unlinked_draft_from_non_owner_before_manifest_preflight(string action)
    {
        Mock<IDraftRequestRepository> repository = new(MockBehavior.Strict);
        repository.Setup(r => r.GetAccessMetadataAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId,
                DraftId, CancellationToken.None))
            .ReturnsAsync(OwnedDraftFacts() with { CreatedByUserId = "different-owner" });
        Mock<IRunDetailQueryService> preflight = new(MockBehavior.Strict);
        DraftRequestsController sut = BuildSut(runDetails: preflight.Object, draftRepository: repository.Object);

        IActionResult result = await InvokeQuestionActionAsync(sut, action);

        result.Should().BeAssignableTo<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        _service.VerifyNoOtherCalls();
        _audit.VerifyNoOtherCalls();
        preflight.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("list", false, false, false)]
    [InlineData("list", true, false, true)]
    [InlineData("answer", true, false, false)]
    [InlineData("skip", true, true, true)]
    [InlineData("answer", true, true, true)]
    public async Task Questions_reuse_linked_architecture_read_or_decide_permission(
        string action, bool canRead, bool canDecide, bool allowed)
    {
        Guid architectureId = Guid.NewGuid();
        Mock<IDraftRequestRepository> repository = new(MockBehavior.Strict);
        repository.Setup(r => r.GetAccessMetadataAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId,
                DraftId, CancellationToken.None))
            .ReturnsAsync(OwnedDraftFacts() with { ArchitectureId = architectureId, CreatedByUserId = "different-owner" });
        Mock<IArchitectureShareAccessGate> shares = new(MockBehavior.Strict);
        DraftRequestsController sut = BuildSut(shares.Object, draftRepository: repository.Object);
        shares.Setup(g => g.EvaluateArchitectureAsync(sut.User, Scope, architectureId, CancellationToken.None))
            .ReturnsAsync(new ArchitectureShareAccessEvaluation
            {
                ArchitectureFound = true, CanRead = canRead, CanDecide = canDecide,
            });
        _service.Setup(q => q.GetQuestionsAsync(Scope, DraftId, AuthorizedRevision, CancellationToken.None))
            .ReturnsAsync(new DraftQuestionsResponse { DraftId = DraftId });
        _service.Setup(q => q.AnswerQuestionAsync(Scope, DraftId, It.IsAny<AnswerDraftQuestionRequest>(),
                AuthorizedRevision, CancellationToken.None))
            .ReturnsAsync(new DraftRequestResponse { DraftId = DraftId });
        _service.Setup(q => q.SkipQuestionAsync(Scope, DraftId, It.IsAny<SkipDraftQuestionRequest>(),
                AuthorizedRevision, CancellationToken.None))
            .ReturnsAsync(new DraftRequestResponse { DraftId = DraftId });

        IActionResult result = await InvokeQuestionActionAsync(sut, action);

        if (allowed)
        {
            result.Should().BeOfType<OkObjectResult>();
            _service.Invocations.Should().ContainSingle();
        }
        else
        {
            result.Should().BeAssignableTo<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
            _service.VerifyNoOtherCalls();
            _audit.VerifyNoOtherCalls();
        }
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Questions_deny_a_draft_with_an_unreadable_run_anchor(bool useSpawnedRun)
    {
        Guid runId = Guid.NewGuid();
        Mock<IDraftRequestRepository> repository = new(MockBehavior.Strict);
        repository.Setup(r => r.GetAccessMetadataAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId,
                DraftId, CancellationToken.None))
            .ReturnsAsync(OwnedDraftFacts() with
            {
                PriorRunId = useSpawnedRun ? null : runId.ToString("N"),
                SpawnedRunId = useSpawnedRun ? runId.ToString("D") : null,
            });
        Mock<IRunDetailQueryService> preflight = new(MockBehavior.Strict);
        Mock<IArchitectureShareAccessGate> shares = new(MockBehavior.Strict);
        DraftRequestsController sut = BuildSut(shares.Object, preflight.Object, draftRepository: repository.Object);
        shares.Setup(g => g.EvaluateRunReadAsync(sut.User, Scope, runId, CancellationToken.None))
            .ReturnsAsync((true, false));

        IActionResult result = await sut.GetDraftQuestions(DraftId, CancellationToken.None);

        result.Should().BeAssignableTo<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        _service.VerifyNoOtherCalls();
        preflight.VerifyNoOtherCalls();
    }

    private static Task<IActionResult> InvokeQuestionActionAsync(DraftRequestsController sut, string action) =>
        action switch
        {
            "list" => sut.GetDraftQuestions(DraftId, CancellationToken.None),
            "answer" => sut.AnswerQuestion(DraftId,
                new AnswerDraftQuestionRequest { QuestionKey = "question", Answer = "yes" }, CancellationToken.None),
            "skip" => sut.SkipQuestion(DraftId,
                new SkipDraftQuestionRequest { QuestionKey = "question" }, CancellationToken.None),
            _ => throw new ArgumentOutOfRangeException(nameof(action)),
        };

    [Theory]
    [InlineData(nameof(DraftRequestsController.GetDraftQuestions))]
    [InlineData(nameof(DraftRequestsController.AnswerQuestion))]
    [InlineData(nameof(DraftRequestsController.SkipQuestion))]
    [InlineData(nameof(DraftRequestsController.ReasonDraft))]
    public async Task Intake_actions_do_not_load_manifests_for_denied_or_missing_runs(string action)
    {
        Guid deniedRun = Guid.NewGuid();
        Guid missingRun = Guid.NewGuid();
        Mock<IArchitectureShareAccessGate> shares = new(MockBehavior.Strict);
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        DraftRequestsController sut = BuildSut(shares.Object, RunDetails(deniedRun, missingRun), authority.Object);

        shares.Setup(gate => gate.EvaluateRunReadAsync(sut.User, Scope, deniedRun, CancellationToken.None))
            .ReturnsAsync((true, false));
        shares.Setup(gate => gate.EvaluateRunReadAsync(sut.User, Scope, missingRun, CancellationToken.None))
            .ReturnsAsync((false, false));

        IActionResult result = action switch
        {
            nameof(DraftRequestsController.GetDraftQuestions) =>
                await sut.GetDraftQuestions(DraftId, CancellationToken.None),
            nameof(DraftRequestsController.AnswerQuestion) =>
                await sut.AnswerQuestion(DraftId, new AnswerDraftQuestionRequest { QuestionKey = "question", Answer = "yes" },
                    CancellationToken.None),
            nameof(DraftRequestsController.SkipQuestion) =>
                await sut.SkipQuestion(DraftId, new SkipDraftQuestionRequest { QuestionKey = "question" },
                    CancellationToken.None),
            nameof(DraftRequestsController.ReasonDraft) =>
                await sut.ReasonDraft(DraftId, new DraftIntakeReasonRequest { Message = "why?" }, CancellationToken.None),
            _ => throw new ArgumentOutOfRangeException(nameof(action), action, null),
        };

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        if (action == nameof(DraftRequestsController.ReasonDraft))
            _reasoning.Invocations.Should().ContainSingle();
        else
            _service.Invocations.Should().ContainSingle();
        shares.Verify(gate => gate.EvaluateRunReadAsync(sut.User, Scope, deniedRun, CancellationToken.None), Times.Once);
        shares.Verify(gate => gate.EvaluateRunReadAsync(sut.User, Scope, missingRun, CancellationToken.None), Times.Once);
        authority.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Intake_preflight_verifies_only_the_first_readable_committed_manifest(bool validSeal)
    {
        Guid deniedRun = Guid.NewGuid();
        Guid allowedRun = Guid.NewGuid();
        Guid olderRun = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        Mock<IArchitectureShareAccessGate> shares = new(MockBehavior.Strict);
        Mock<IAuthorityQueryService> authority = new(MockBehavior.Strict);
        DraftRequestsController sut = BuildSut(shares.Object, RunDetails(deniedRun, allowedRun, olderRun), authority.Object);
        MockSequence sequence = new();
        shares.InSequence(sequence).Setup(gate =>
                gate.EvaluateRunReadAsync(sut.User, Scope, deniedRun, CancellationToken.None))
            .ReturnsAsync((true, false));
        shares.InSequence(sequence).Setup(gate =>
                gate.EvaluateRunReadAsync(sut.User, Scope, allowedRun, CancellationToken.None))
            .ReturnsAsync((true, true));
        authority.InSequence(sequence).Setup(query => query.GetRunDetailForManifestCompareAsync(
                It.Is<ScopeContext>(scope => scope.TenantId == Scope.TenantId &&
                    scope.WorkspaceId == Scope.WorkspaceId && scope.ProjectId == Scope.ProjectId),
                allowedRun, CancellationToken.None))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = allowedRun, GoldenManifestId = manifestId },
                GoldenManifest = new ManifestDocument
                {
                    RunId = allowedRun,
                    ManifestId = manifestId,
                    ManifestHash = validSeal ? SealedManifestHashTestSupport.DefaultHash : "invalid",
                },
            });
        _service.Setup(service => service.GetQuestionsAsync(Scope, DraftId, AuthorizedRevision, CancellationToken.None))
            .ReturnsAsync(new DraftQuestionsResponse { DraftId = DraftId });

        IActionResult result = await sut.GetDraftQuestions(DraftId, CancellationToken.None);

        if (validSeal)
        {
            result.Should().BeOfType<OkObjectResult>();
        }
        else
        {
            result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status409Conflict);
            _service.Invocations.Should().BeEmpty();
        }
        shares.Invocations.Should().HaveCount(2);
        authority.Invocations.Should().ContainSingle();
    }

    private static IRunDetailQueryService RunDetails(params Guid[] runIds)
    {
        IReadOnlyList<RunSummary> summaries = runIds.Select(id => new RunSummary
        {
            RunId = id.ToString("N"),
            Status = nameof(ArchitectureRunStatus.Committed),
        }).ToList();
        Mock<IRunDetailQueryService> runs = new(MockBehavior.Strict);
        runs.Setup(service => service.ListRunSummariesKeysetAsync(null, 50, CancellationToken.None))
            .ReturnsAsync((summaries, false, (string?)null));
        return runs.Object;
    }

    [Fact]
    public async Task CreateDraft_NullBody_ReturnsBadRequest_AndDoesNotAudit()
    {
        DraftRequestsController sut = BuildSut();

        IActionResult result = await sut.CreateDraft(null, CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        _audit.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateDraft_Valid_ReturnsCreated_AndAudits()
    {
        DraftRequestResponse created = new() { DraftId = DraftId, Status = DraftRequestStatus.Drafting };
        _service
            .Setup(static s => s.CreateAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CreateDraftRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(created);

        DraftRequestsController sut = BuildSut();

        IActionResult result = await sut.CreateDraft(
            new CreateDraftRequest
            {
                FreeTextIntent =
                    "Build a compliance workflow platform for analysts with governed evidence intake, Entra ID authentication, and exportable architecture review packages.",
            },
            CancellationToken.None);

        CreatedAtActionResult createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.Value.Should().BeSameAs(created);
        _audit.Verify(
            static a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.DraftIntakeCreated),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ListDrafts_ReturnsPagedSummaries()
    {
        PagedResponse<DraftRequestSummaryResponse> page = new()
        {
            Items =
            [
                new DraftRequestSummaryResponse
                {
                    DraftId = DraftId,
                    Status = DraftRequestStatus.Drafting,
                    FreeTextIntent = "Intent",
                },
            ],
            TotalCount = 1,
            Page = 1,
            PageSize = 50,
        };

        _service
            .Setup(static s => s.ListAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<IReadOnlyList<DraftRequestStatus>>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(page);

        DraftRequestsController sut = BuildSut();

        IActionResult result = await sut.ListDrafts(mine: true, cancellationToken: CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(page);
    }

    [Fact]
    public async Task ListDrafts_MineOmitted_ReturnsPagedSummaries()
    {
        PagedResponse<DraftRequestSummaryResponse> page = new()
        {
            Items = [],
            TotalCount = 0,
            Page = 1,
            PageSize = 50,
        };

        _service
            .Setup(static s => s.ListAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<IReadOnlyList<DraftRequestStatus>>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(page);

        DraftRequestsController sut = BuildSut();

        IActionResult result = await sut.ListDrafts(cancellationToken: CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(page);
    }

    [Fact]
    public async Task ListDrafts_MineFalse_ReturnsBadRequest()
    {
        DraftRequestsController sut = BuildSut();

        IActionResult result = await sut.ListDrafts(mine: false, cancellationToken: CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task ListDrafts_MineNull_ReturnsPagedSummaries()
    {
        PagedResponse<DraftRequestSummaryResponse> page = new()
        {
            Items = [],
            TotalCount = 0,
            Page = 1,
            PageSize = 50,
        };

        _service
            .Setup(static s => s.ListAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<IReadOnlyList<DraftRequestStatus>>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(page);

        DraftRequestsController sut = BuildSut();

        IActionResult result = await sut.ListDrafts(mine: null, cancellationToken: CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(page);
    }

    [Fact]
    public async Task GetDraft_NotFound_ReturnsNotFoundProblem()
    {
        _service
            .Setup(static s => s.GetAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((DraftRequestResponse?)null);

        DraftRequestsController sut = BuildSut();
        sut.ControllerContext.HttpContext.TraceIdentifier = "corr-draft-missing";

        IActionResult result = await sut.GetDraft(DraftId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task GetDraft_Found_ReturnsOk()
    {
        DraftRequestResponse draft = new() { DraftId = DraftId, Status = DraftRequestStatus.Drafting };
        _service
            .Setup(static s => s.GetAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(draft);

        DraftRequestsController sut = BuildSut();
        sut.ControllerContext.HttpContext.TraceIdentifier = "corr-draft-found";

        IActionResult result = await sut.GetDraft(DraftId, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(draft);
    }

    [Fact]
    public async Task GetDraftQuestions_ReturnsOk_WithSelection()
    {
        DraftQuestionsResponse response = new()
        {
            DraftId = DraftId,
            Status = DraftRequestStatus.Drafting,
        };
        _service
            .Setup(static s => s.GetQuestionsAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                AuthorizedRevision,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(response);

        DraftRequestsController sut = BuildSut();

        IActionResult result = await sut.GetDraftQuestions(DraftId, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(response);
    }

    [Fact]
    public async Task AdmitDraft_ReturnsOk_AndAudits()
    {
        DraftAdmissionResponse admission = new()
        {
            Admitted = true,
            Status = DraftRequestStatus.Admitted,
            Draft = new DraftRequestResponse { DraftId = DraftId },
        };
        _service
            .Setup(static s => s.RequestAdmissionAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(admission);

        DraftRequestsController sut = BuildSut();

        IActionResult result = await sut.AdmitDraft(DraftId, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(admission);
        _audit.Verify(
            static a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.DraftIntakeAdmissionEvaluated),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task SkipQuestion_Valid_ReturnsOk_AndAuditsSkip()
    {
        DraftRequestResponse updated = new() { DraftId = DraftId, Status = DraftRequestStatus.Drafting };
        _service
            .Setup(static s => s.SkipQuestionAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<SkipDraftQuestionRequest>(),
                AuthorizedRevision,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(updated);

        DraftRequestsController sut = BuildSut();

        IActionResult result = await sut.SkipQuestion(
            DraftId,
            new SkipDraftQuestionRequest { QuestionKey = "l0.pillar.cost" },
            CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        _audit.Verify(
            static a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.DraftIntakeQuestionSkipped),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task SubmitDraft_NotFound_ReturnsNotFound_AndDoesNotAudit()
    {
        _service
            .Setup(static s => s.SubmitAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<DateTime?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((SubmitDraftResponse?)null);

        DraftRequestsController sut = BuildSut();

        IActionResult result = await sut.SubmitDraft(DraftId, null, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        _audit.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task SubmitDraft_BadState_ReturnsBadRequest()
    {
        _service
            .Setup(static s => s.SubmitAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<DateTime?>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("MUST question 'l0.pillar.cost' must be answered before submit."));

        DraftRequestsController sut = BuildSut();

        IActionResult result = await sut.SubmitDraft(DraftId, null, CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task DownloadDraftDecisionReceipt_NotExportable_ReturnsNotFound_AndDoesNotAudit()
    {
        _decisionReceipt
            .Setup(static s => s.BuildForDraftAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((DecisionReceiptDocument?)null);

        DraftRequestsController sut = BuildSut();

        IActionResult result = await sut.DownloadDraftDecisionReceipt(DraftId, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        _audit.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DownloadDraftDecisionReceipt_ReturnsJson_AndAudits()
    {
        DecisionReceiptDocument receipt = new()
        {
            DraftId = DraftId,
            Source = DecisionReceiptSource.DraftAdmission,
            Verdict = new ArchLucid.Contracts.Architecture.FeasibilityVerdict
            {
                Kind = ArchLucid.Contracts.Architecture.FeasibilityVerdictKind.SoftInfeasible,
                Summary = "Redirected.",
            },
        };

        _decisionReceipt
            .Setup(static s => s.BuildForDraftAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(receipt);

        DraftRequestsController sut = BuildSut();

        IActionResult result = await sut.DownloadDraftDecisionReceipt(DraftId, CancellationToken.None);

        FileContentResult file = result.Should().BeOfType<FileContentResult>().Subject;
        file.ContentType.Should().Be("application/json");
        _audit.Verify(
            static a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.DecisionReceiptExported),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ReopenDraft_ReturnsOk_AndAudits()
    {
        DraftRequestResponse reopened = new() { DraftId = DraftId, Status = DraftRequestStatus.Drafting };
        _service
            .Setup(static s => s.ReopenAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(reopened);

        DraftRequestsController sut = BuildSut();

        IActionResult result = await sut.ReopenDraft(DraftId, CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(reopened);
        _audit.Verify(
            static a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.DraftIntakeReopened),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
