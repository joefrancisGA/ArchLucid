using ArchLucid.Api.Controllers.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Exports;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;

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

    public DraftRequestsControllerTests()
    {
        _scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);
        _actorContext.Setup(static a => a.GetActor()).Returns("op-display");
        _actorContext.Setup(static a => a.GetActorId()).Returns("op-id");
    }

    private DraftRequestsController BuildSut() =>
        new(
            _scopeProvider.Object,
            _actorContext.Object,
            _service.Object,
            _reasoning.Object,
            _decisionReceipt.Object,
            _audit.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

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
