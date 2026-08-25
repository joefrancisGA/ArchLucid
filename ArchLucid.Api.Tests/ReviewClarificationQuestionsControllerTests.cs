using ArchLucid.Api.Controllers.Authority;
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

    private static readonly Guid MissingRunId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [Fact]
    public async Task GetClarificationQuestions_returns_not_found_when_run_missing()
    {
        Mock<IReviewClarificationQuestionService> questions = new();
        questions
            .Setup(s => s.GetQuestionsAsync(Scope, MissingRunId, null, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RunNotFoundException(MissingRunId.ToString("N")));

        ReviewClarificationQuestionsController controller = CreateController(questions: questions.Object);

        IActionResult action = await controller.GetClarificationQuestions(MissingRunId, null, CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task ApplyKnowledgeModelClarificationAnswers_returns_not_found_when_run_missing()
    {
        Mock<IReviewClarificationQuestionService> questions = new();
        questions
            .Setup(s => s.GetQuestionsAsync(Scope, MissingRunId, null, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RunNotFoundException(MissingRunId.ToString("N")));

        Mock<IKnowledgeModelClarificationAnswerApplicator> applicator = new();

        ReviewClarificationQuestionsController controller = CreateController(
            questions: questions.Object,
            applicator: applicator.Object);

        ApplyKnowledgeModelClarificationAnswersRequest request = new()
        {
            Answers = new Dictionary<string, string> { ["km-q1"] = "yes" },
        };

        IActionResult action = await controller.ApplyKnowledgeModelClarificationAnswers(
            MissingRunId,
            request,
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        applicator.Verify(
            a => a.ApplyAnswersAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<IReadOnlyDictionary<string, string>>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static ReviewClarificationQuestionsController CreateController(
        IReviewClarificationQuestionService? questions = null,
        IKnowledgeModelClarificationAnswerApplicator? applicator = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        return new ReviewClarificationQuestionsController(
            questions ?? Mock.Of<IReviewClarificationQuestionService>(),
            applicator ?? Mock.Of<IKnowledgeModelClarificationAnswerApplicator>(),
            Mock.Of<IClarificationAnswerReReviewCoordinator>(),
            Mock.Of<IClarificationResolvedFindingMuter>(),
            Mock.Of<IAuditService>(),
            scopeProvider.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
