using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Clarifications;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Clarifications;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ReviewClarificationQuestionsControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid MissingRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private readonly Mock<IReviewClarificationQuestionService> _questions = new();
    private readonly Mock<IKnowledgeModelClarificationAnswerApplicator> _applicator = new();
    private readonly Mock<IClarificationAnswerReReviewCoordinator> _reReview = new();
    private readonly Mock<IClarificationResolvedFindingMuter> _muter = new();
    private readonly Mock<IAuditService> _audit = new();
    private readonly Mock<IScopeContextProvider> _scopeProvider = new();

    public ReviewClarificationQuestionsControllerTests()
    {
        _scopeProvider.Setup(static s => s.GetCurrentScope()).Returns(Scope);
    }

    [Fact]
    public async Task GetClarificationQuestions_missing_run_returns_404()
    {
        _questions
            .Setup(static s => s.GetQuestionsAsync(
                It.IsAny<ScopeContext>(),
                MissingRunId,
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RunNotFoundException(MissingRunId.ToString("N")));

        ReviewClarificationQuestionsController sut = CreateSut();

        IActionResult result = await sut.GetClarificationQuestions(MissingRunId, priorRunId: null, CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            notFound.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.RunNotFound);
    }

    [Fact]
    public async Task ApplyKnowledgeModelClarificationAnswers_missing_run_returns_404_like_get()
    {
        _questions
            .Setup(static s => s.GetQuestionsAsync(
                It.IsAny<ScopeContext>(),
                MissingRunId,
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RunNotFoundException(MissingRunId.ToString("N")));

        _applicator
            .Setup(static a => a.ApplyAnswersAsync(
                It.IsAny<ScopeContext>(),
                MissingRunId,
                It.IsAny<IReadOnlyDictionary<string, string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new KnowledgeModelClarificationApplyResult());

        ReviewClarificationQuestionsController sut = CreateSut();
        ApplyKnowledgeModelClarificationAnswersRequest request = new()
        {
            Answers = { ["km-elem-1"] = "yes" },
        };

        IActionResult result = await sut.ApplyKnowledgeModelClarificationAnswers(
            MissingRunId,
            request,
            CancellationToken.None);

        ObjectResult notFound = result.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            notFound.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.RunNotFound);

        _applicator.Verify(
            static a => a.ApplyAnswersAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<IReadOnlyDictionary<string, string>>(),
                It.IsAny<CancellationToken>()),
            Times.Never);

        _audit.Verify(
            static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ApplyKnowledgeModelClarificationAnswers_null_body_returns_400()
    {
        ReviewClarificationQuestionsController sut = CreateSut();

        IActionResult result = await sut.ApplyKnowledgeModelClarificationAnswers(
            MissingRunId,
            request: null,
            CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            bad.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.RequestBodyRequired);
    }

    [Fact]
    public async Task ApplyKnowledgeModelClarificationAnswers_existing_run_returns_ok()
    {
        Guid runId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        _questions
            .Setup(s => s.GetQuestionsAsync(
                It.IsAny<ScopeContext>(),
                runId,
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ReviewClarificationQuestionsResponse { RunId = runId.ToString("N") });

        KnowledgeModelClarificationApplyResult applyResult = new();
        applyResult.AppliedAnswers["km-elem-1"] = "yes";
        _applicator
            .Setup(a => a.ApplyAnswersAsync(
                It.IsAny<ScopeContext>(),
                runId,
                It.IsAny<IReadOnlyDictionary<string, string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(applyResult);

        _muter
            .Setup(m => m.MuteResolvedAsync(
                It.IsAny<ScopeContext>(),
                runId,
                It.IsAny<IReadOnlyDictionary<string, string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);

        _reReview
            .Setup(r => r.TryRunAfterApplyAsync(
                It.IsAny<ScopeContext>(),
                runId,
                It.IsAny<int>(),
                It.IsAny<IReadOnlyDictionary<string, string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((IncrementalReReviewResult?)null);

        ReviewClarificationQuestionsController sut = CreateSut();
        ApplyKnowledgeModelClarificationAnswersRequest request = new()
        {
            Answers = { ["km-elem-1"] = "yes" },
        };

        IActionResult result = await sut.ApplyKnowledgeModelClarificationAnswers(
            runId,
            request,
            CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ApplyKnowledgeModelClarificationAnswersResponse body =
            ok.Value.Should().BeOfType<ApplyKnowledgeModelClarificationAnswersResponse>().Subject;
        body.AppliedCount.Should().Be(1);
        body.ReReviewTriggered.Should().BeFalse();
    }

    private ReviewClarificationQuestionsController CreateSut() =>
        new(
            _questions.Object,
            _applicator.Object,
            _reReview.Object,
            _muter.Object,
            _audit.Object,
            _scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
}
