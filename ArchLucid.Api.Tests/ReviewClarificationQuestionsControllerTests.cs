using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Application;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Clarifications;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Clarifications;
using ArchLucid.Contracts.Drafts;
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

    [Fact]
    public async Task GetClarificationQuestions_when_run_missing_returns_not_found()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Mock<IReviewClarificationQuestionService> questions = new();
        questions
            .Setup(s => s.GetQuestionsAsync(Scope, runId, null, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RunNotFoundException(runId.ToString("N")));

        ReviewClarificationQuestionsController controller = CreateController(questions.Object);

        IActionResult action = await controller.GetClarificationQuestions(runId, null, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task ApplyKnowledgeModelClarificationAnswers_when_run_missing_returns_not_found_like_get()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Mock<IReviewClarificationQuestionService> questions = new();
        questions
            .Setup(s => s.GetQuestionsAsync(Scope, runId, null, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RunNotFoundException(runId.ToString("N")));

        Mock<IKnowledgeModelClarificationAnswerApplicator> applicator = new();
        Mock<IAuditService> audit = new();

        ReviewClarificationQuestionsController controller = CreateController(
            questions.Object,
            applicator.Object,
            audit: audit.Object);

        ApplyKnowledgeModelClarificationAnswersRequest request = new()
        {
            Answers = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["km-q1"] = "answer text",
            },
        };

        IActionResult action = await controller.ApplyKnowledgeModelClarificationAnswers(
            runId,
            request,
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);

        applicator.Verify(
            s => s.ApplyAnswersAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<IReadOnlyDictionary<string, string>>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ApplyKnowledgeModelClarificationAnswers_returns_bad_request_when_answer_exceeds_max_length()
    {
        Guid runId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        string overLimit = new string('x', DraftIntakeValidation.MaximumFreeTextIntentLength + 1);

        Mock<IReviewClarificationQuestionService> questions = new();
        questions
            .Setup(s => s.GetQuestionsAsync(Scope, runId, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ReviewClarificationQuestionsResponse());

        Mock<IKnowledgeModelClarificationAnswerApplicator> applicator = new();

        ReviewClarificationQuestionsController controller = CreateController(
            questions.Object,
            applicator.Object);

        ApplyKnowledgeModelClarificationAnswersRequest request = new()
        {
            Answers = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["km-q1"] = overLimit,
            },
        };

        IActionResult action = await controller.ApplyKnowledgeModelClarificationAnswers(
            runId,
            request,
            CancellationToken.None);

        ObjectResult bad = action.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        applicator.Verify(
            s => s.ApplyAnswersAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<IReadOnlyDictionary<string, string>>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static ReviewClarificationQuestionsController CreateController(
        IReviewClarificationQuestionService? clarificationQuestionService = null,
        IKnowledgeModelClarificationAnswerApplicator? clarificationAnswerApplicator = null,
        IClarificationAnswerReReviewCoordinator? clarificationAnswerReReviewCoordinator = null,
        IClarificationResolvedFindingMuter? clarificationResolvedFindingMuter = null,
        IAuditService? audit = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        return new ReviewClarificationQuestionsController(
            clarificationQuestionService ?? Mock.Of<IReviewClarificationQuestionService>(),
            clarificationAnswerApplicator ?? Mock.Of<IKnowledgeModelClarificationAnswerApplicator>(),
            clarificationAnswerReReviewCoordinator ?? Mock.Of<IClarificationAnswerReReviewCoordinator>(),
            clarificationResolvedFindingMuter ?? Mock.Of<IClarificationResolvedFindingMuter>(),
            audit ?? Mock.Of<IAuditService>(),
            scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
