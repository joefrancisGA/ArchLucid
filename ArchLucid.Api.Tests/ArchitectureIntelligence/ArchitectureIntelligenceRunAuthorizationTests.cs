using System.Security.Claims;

using ArchLucid.Api.Controllers.ArchitectureIntelligence;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Persistence.Models;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureIntelligenceRunAuthorizationTests
{
    private const string Actor = """["subject","https://issuer.example","owner"]""";
    private static readonly CancellationToken Ct = CancellationToken.None;
    private readonly ScopeContext _scope = new()
    {
        TenantId = Guid.NewGuid(),
        WorkspaceId = Guid.NewGuid(),
        ProjectId = Guid.NewGuid(),
    };
    private readonly ClaimsPrincipal _principal = new(new ClaimsIdentity(
        [new Claim(ClaimTypes.NameIdentifier, "owner"), new Claim("iss", "https://issuer.example")], "Test"));
    private readonly InMemoryArchitectureIntelligenceStandaloneRunStore _standalone = new();
    private readonly Mock<IArchitectureShareAccessGate> _gate = new(MockBehavior.Strict);
    private readonly Mock<IAuthorityQueryService> _authority = new(MockBehavior.Strict);
    private readonly Mock<IArchitectureKnowledgeModelAccess> _model = new(MockBehavior.Strict);
    private readonly Mock<IClosedLoopArchitectureReasoningOrchestrator> _orchestrator = new(MockBehavior.Strict);
    private readonly Mock<IGoldenArchitectureTestRunner> _golden = new(MockBehavior.Strict);
    private readonly Mock<IArchitectureIntelligenceProductRunSourceContextLoader> _productLoader = new(MockBehavior.Strict);

    [Theory]
    [InlineData("model")]
    [InlineData("sources")]
    [InlineData("continue")]
    [InlineData("publish")]
    [InlineData("run")]
    [InlineData("run-continue")]
    [InlineData("golden")]
    public async Task Unshared_product_run_is_hidden_before_any_payload_or_orchestration(string action)
    {
        Guid runId = Guid.NewGuid();
        // Even a binding must not override an explicit product-run denial.
        await _standalone.BindNewAsync(_scope, runId, Actor, Ct);
        _gate.Setup(g => g.EvaluateRunReadAsync(_principal, _scope, runId, Ct)).ReturnsAsync((true, false));

        IActionResult result = await InvokeAsync(CreateController(), action, runId.ToString("B"));

        AssertProblem(result, StatusCodes.Status404NotFound, ProblemTypes.RunNotFound);
        _gate.Verify(g => g.EvaluateRunReadAsync(_principal, _scope, runId, Ct), Times.Once);
        _authority.VerifyNoOtherCalls();
        _model.VerifyNoOtherCalls();
        _orchestrator.VerifyNoOtherCalls();
        _productLoader.VerifyNoOtherCalls();
        _golden.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("continue")]
    [InlineData("publish")]
    [InlineData("run")]
    [InlineData("run-continue")]
    [InlineData("golden")]
    public async Task Read_only_product_share_cannot_mutate_or_load_payload(string action)
    {
        Guid runId = Guid.NewGuid();
        ArchitectureIntelligenceController controller = CreateController();
        MockSequence sequence = new();
        _gate.InSequence(sequence).Setup(g => g.EvaluateRunReadAsync(_principal, _scope, runId, Ct))
            .ReturnsAsync((true, true));
        _gate.InSequence(sequence).Setup(g => g.EnsureRunDecideAllowedAsync(controller, _principal, _scope, runId, Ct))
            .ReturnsAsync(ArchitectureShareNotVisibleAsNotFoundResponsePolicy.RunNotFound(controller, runId));

        IActionResult result = await InvokeAsync(controller, action, runId.ToString("D"));

        AssertProblem(result, StatusCodes.Status404NotFound, ProblemTypes.RunNotFound);
        _gate.Verify(g => g.EnsureRunDecideAllowedAsync(controller, _principal, _scope, runId, Ct), Times.Once);
        _authority.VerifyNoOtherCalls();
        _orchestrator.VerifyNoOtherCalls();
        _golden.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("model")]
    [InlineData("continue")]
    [InlineData("publish")]
    [InlineData("run")]
    public async Task Authorized_run_with_invalid_seal_returns_conflict_without_downstream_access(string action)
    {
        Guid runId = Guid.NewGuid();
        ArchitectureIntelligenceController controller = CreateController();
        MockSequence sequence = new();
        _gate.InSequence(sequence).Setup(g => g.EvaluateRunReadAsync(_principal, _scope, runId, Ct))
            .ReturnsAsync((true, true));
        if (action != "model")
        {
            _gate.InSequence(sequence).Setup(g => g.EnsureRunDecideAllowedAsync(controller, _principal, _scope, runId, Ct))
                .ReturnsAsync((IActionResult?)null);
        }

        _authority.InSequence(sequence).Setup(q => q.GetRunDetailForManifestCompareAsync(_scope, runId, Ct))
            .ReturnsAsync(SealedDetail(runId, "invalid"));

        IActionResult result = await InvokeAsync(controller, action, runId.ToString("N"));

        AssertProblem(result, StatusCodes.Status409Conflict, ProblemTypes.Conflict);
        _authority.Verify(q => q.GetRunDetailForManifestCompareAsync(_scope, runId, Ct), Times.Once);
        _model.VerifyNoOtherCalls();
        _orchestrator.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Missing_seal_on_authorized_committed_run_is_a_conflict()
    {
        Guid runId = Guid.NewGuid();
        _gate.Setup(g => g.EvaluateRunReadAsync(_principal, _scope, runId, Ct)).ReturnsAsync((true, true));
        _authority.Setup(q => q.GetRunDetailForManifestCompareAsync(_scope, runId, Ct))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = runId, LegacyRunStatus = nameof(ArchitectureRunStatus.Committed) },
            });

        IActionResult result = await CreateController().GetRunModelAsync(runId.ToString("D"), Ct);

        AssertProblem(result, StatusCodes.Status409Conflict, ProblemTypes.Conflict);
        _model.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Missing_run_after_authorization_does_not_fall_back_to_model_storage()
    {
        Guid runId = Guid.NewGuid();
        _gate.Setup(g => g.EvaluateRunReadAsync(_principal, _scope, runId, Ct)).ReturnsAsync((true, true));
        _authority.Setup(q => q.GetRunDetailForManifestCompareAsync(_scope, runId, Ct))
            .ReturnsAsync((RunDetailDto?)null);

        IActionResult result = await CreateController().GetRunModelAsync(runId.ToString("D"), Ct);

        AssertProblem(result, StatusCodes.Status404NotFound, ProblemTypes.RunNotFound);
        _model.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Authenticated_display_name_without_a_stable_subject_cannot_claim_standalone_ownership()
    {
        Guid runId = Guid.NewGuid();
        ArchitectureIntelligenceController controller = CreateController();
        ClaimsPrincipal displayNameOnly = new(new ClaimsIdentity([new Claim(ClaimTypes.Name, Actor)], "Test"));
        controller.HttpContext.User = displayNameOnly;
        await _standalone.BindNewAsync(_scope, runId, Actor, Ct);
        _gate.Setup(g => g.EvaluateRunReadAsync(displayNameOnly, _scope, runId, Ct)).ReturnsAsync((false, false));

        AssertProblem(await controller.GetRunModelAsync(runId.ToString("D"), Ct),
            StatusCodes.Status404NotFound, ProblemTypes.RunNotFound);
        (await controller.PostRunAsync(CreateBody(), Ct)).Should().BeOfType<ForbidResult>();
        _model.VerifyNoOtherCalls();
        _orchestrator.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Authorized_sealed_model_read_uses_one_detail_query_then_loads_the_exact_model()
    {
        Guid runId = Guid.NewGuid();
        ArchitectureKnowledgeModel model = new();
        MockSequence sequence = new();
        _gate.InSequence(sequence).Setup(g => g.EvaluateRunReadAsync(_principal, _scope, runId, Ct))
            .ReturnsAsync((true, true));
        _authority.InSequence(sequence).Setup(q => q.GetRunDetailForManifestCompareAsync(_scope, runId, Ct))
            .ReturnsAsync(SealedDetail(runId, SealedManifestHashTestSupport.DefaultHash));
        _model.InSequence(sequence).Setup(m => m.GetForRunAsync(_scope, runId, Ct)).ReturnsAsync(model);

        IActionResult result = await CreateController().GetRunModelAsync(runId.ToString("B"), Ct);

        result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeSameAs(model);
        _authority.Verify(q => q.GetRunDetailForManifestCompareAsync(_scope, runId, Ct), Times.Once);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Fresh_run_skips_hidden_seal_and_checks_the_first_readable_candidate(bool invalidVisibleSeal)
    {
        Guid hidden = Guid.NewGuid();
        Guid visible = Guid.NewGuid();
        Guid issued = Guid.Empty;
        Mock<IRunDetailQueryService> summaries = new(MockBehavior.Strict);
        summaries.Setup(q => q.ListRunSummariesKeysetAsync(null, 50, Ct))
            .ReturnsAsync((new[] { Summary(hidden), Summary(visible) }, false, (string?)null));
        MockSequence sequence = new();
        _gate.InSequence(sequence).Setup(g => g.EvaluateRunReadAsync(_principal, _scope, hidden, Ct))
            .ReturnsAsync((true, false));
        _gate.InSequence(sequence).Setup(g => g.EvaluateRunReadAsync(_principal, _scope, visible, Ct))
            .ReturnsAsync((true, true));
        _authority.InSequence(sequence).Setup(q => q.GetRunDetailForManifestCompareAsync(
                It.Is<ScopeContext>(s => MatchesScope(s)), visible, Ct))
            .ReturnsAsync(SealedDetail(visible, invalidVisibleSeal ? "invalid" : SealedManifestHashTestSupport.DefaultHash));
        if (!invalidVisibleSeal)
        {
            _orchestrator.InSequence(sequence).Setup(o => o.RunAsync(It.IsAny<ClosedLoopReasoningRequest>(), Ct))
                .Returns(async (ClosedLoopReasoningRequest request, CancellationToken ct) =>
                {
                    issued = Guid.Parse(request.RunId!);
                    (await _standalone.IsOwnedByAsync(_scope, issued, Actor, ct)).Should().BeTrue();
                    return new ClosedLoopReasoningResult { RunId = request.RunId };
                });
        }

        IActionResult result = await CreateController(summaries.Object).PostRunAsync(CreateBody(), Ct);

        if (invalidVisibleSeal)
        {
            AssertProblem(result, StatusCodes.Status409Conflict, ProblemTypes.Conflict);
            _orchestrator.VerifyNoOtherCalls();
        }
        else
        {
            result.Should().BeOfType<OkObjectResult>();
            issued.Should().NotBeEmpty();
        }
        _authority.Verify(q => q.GetRunDetailForManifestCompareAsync(It.IsAny<ScopeContext>(), hidden, Ct), Times.Never);
    }

    [Theory]
    [InlineData("model")]
    [InlineData("sources")]
    [InlineData("continue")]
    [InlineData("publish")]
    [InlineData("run")]
    public async Task Unbound_id_is_not_treated_as_a_fresh_run(string action)
    {
        Guid runId = Guid.NewGuid();
        _gate.Setup(g => g.EvaluateRunReadAsync(_principal, _scope, runId, Ct)).ReturnsAsync((false, false));

        IActionResult result = await InvokeAsync(CreateController(), action, runId.ToString("D"));

        AssertProblem(result, StatusCodes.Status404NotFound, ProblemTypes.RunNotFound);
        _orchestrator.VerifyNoOtherCalls();
        _model.VerifyNoOtherCalls();
        _authority.VerifyNoOtherCalls();
        _productLoader.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("tenant")]
    [InlineData("workspace")]
    [InlineData("project")]
    [InlineData("actor")]
    public async Task Standalone_binding_never_crosses_actor_or_scope(string mismatch)
    {
        Guid runId = Guid.NewGuid();
        ScopeContext other = new()
        {
            TenantId = mismatch == "tenant" ? Guid.NewGuid() : _scope.TenantId,
            WorkspaceId = mismatch == "workspace" ? Guid.NewGuid() : _scope.WorkspaceId,
            ProjectId = mismatch == "project" ? Guid.NewGuid() : _scope.ProjectId,
        };
        await _standalone.BindNewAsync(other, runId, mismatch == "actor" ? "another-actor" : Actor, Ct);
        _gate.Setup(g => g.EvaluateRunReadAsync(_principal, _scope, runId, Ct)).ReturnsAsync((false, false));

        IActionResult result = await CreateController().PostContinueAsync(runId.ToString("D"), null, Ct);

        AssertProblem(result, StatusCodes.Status404NotFound, ProblemTypes.RunNotFound);
        _orchestrator.VerifyNoOtherCalls();
        _authority.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Standalone_owner_can_continue_an_issued_run_but_cannot_load_product_sources()
    {
        Guid runId = Guid.NewGuid();
        await _standalone.BindNewAsync(_scope, runId, Actor, Ct);
        _gate.Setup(g => g.EvaluateRunReadAsync(_principal, _scope, runId, Ct)).ReturnsAsync((false, false));
        _orchestrator.Setup(o => o.RunAsync(
                It.Is<ClosedLoopReasoningRequest>(r => r.RunId == runId.ToString("D") && r.ContinueFromExistingRun), Ct))
            .ReturnsAsync(new ClosedLoopReasoningResult());
        ArchitectureIntelligenceController controller = CreateController();

        IActionResult continued = await controller.PostContinueAsync(runId.ToString("N"), null, Ct);
        IActionResult sources = await controller.GetProductRunSourceContextAsync(runId.ToString("D"), Ct);

        continued.Should().BeOfType<OkObjectResult>();
        AssertProblem(sources, StatusCodes.Status404NotFound, ProblemTypes.RunNotFound);
        _authority.VerifyNoOtherCalls();
        _productLoader.VerifyNoOtherCalls();
    }

    private ArchitectureIntelligenceController CreateController(IRunDetailQueryService? summaries = null) =>
        new(
            _orchestrator.Object,
            _golden.Object,
            _model.Object,
            Mock.Of<IArchitectureIntelligenceProductPublishService>(),
            _productLoader.Object,
            Mock.Of<IScopeContextProvider>(provider => provider.GetCurrentScope() == _scope),
            _authority.Object,
            summaries ?? SealedManifestHashTestSupport.CreateRunDetailQueryServiceWithoutCommittedRuns(),
            SealedManifestHashTestSupport.CreateManifestHashService(),
            Mock.Of<IAuditService>(),
            _gate.Object,
            _standalone)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = _principal } },
        };

    private static Task<IActionResult> InvokeAsync(ArchitectureIntelligenceController controller, string action, string id) =>
        action switch
        {
            "model" => controller.GetRunModelAsync(id, Ct),
            "sources" => controller.GetProductRunSourceContextAsync(id, Ct),
            "continue" => controller.PostContinueAsync(id, null, Ct),
            "publish" => controller.PostPublishAsync(id, null, Ct),
            "run" => controller.PostRunAsync(CreateBody(id), Ct),
            "run-continue" => controller.PostRunAsync(new ClosedLoopReasoningRequest { RunId = id, ContinueFromExistingRun = true }, Ct),
            "golden" => controller.PostGoldenTestAsync(CreateBody(id), Ct),
            _ => throw new ArgumentOutOfRangeException(nameof(action)),
        };

    private static ClosedLoopReasoningRequest CreateBody(string? runId = null) => new()
    {
        RunId = runId,
        SourceTexts = [new ClosedLoopReasoningSourceText { FileName = "architecture.txt", Content = "Architecture source." }],
    };

    private static RunSummary Summary(Guid runId) => new()
    {
        RunId = runId.ToString("D"),
        Status = nameof(ArchitectureRunStatus.Committed),
    };

    private static RunDetailDto SealedDetail(Guid runId, string hash)
    {
        Guid manifestId = Guid.NewGuid();
        return new RunDetailDto
        {
            Run = new RunRecord { RunId = runId, GoldenManifestId = manifestId, LegacyRunStatus = nameof(ArchitectureRunStatus.Committed) },
            GoldenManifest = new ManifestDocument { RunId = runId, ManifestId = manifestId, ManifestHash = hash },
        };
    }

    private bool MatchesScope(ScopeContext scope) => scope.TenantId == _scope.TenantId
        && scope.WorkspaceId == _scope.WorkspaceId && scope.ProjectId == _scope.ProjectId;

    private static void AssertProblem(IActionResult result, int statusCode, string problemType)
    {
        ObjectResult response = result.Should().BeAssignableTo<ObjectResult>().Subject;
        response.StatusCode.Should().Be(statusCode);
        response.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Which.Type.Should().Be(problemType);
    }
}
