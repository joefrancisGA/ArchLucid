using ArchLucid.Api.Controllers.Findings;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

using Moq;

using MvcProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Unit tests for <c>POST v1/architecture/finding/{findingId}/ask</c> validation (no host boot required).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureFindingAskControllerTests
{
    [SkippableFact]
    public async Task AskAboutFinding_returns_bad_request_when_question_missing()
    {
        Mock<IAskService> askService = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        Mock<ILogger<ArchitectureFindingAskController>> logger = new();

        ArchitectureFindingAskController sut = new(askService.Object, scopeProvider.Object, logger.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        Guid findingId = Guid.NewGuid();
        IActionResult result = await sut.AskAboutFinding(
            findingId,
            new FindingAskRequest { Question = "   " },
            CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status400BadRequest);

        MvcProblemDetails details = problem.Value.Should().BeOfType<MvcProblemDetails>().Subject;
        details.Type.Should().Be(ProblemTypes.ValidationFailed);
        details.Detail.Should().Be("Question is required.");

        askService.Verify(
            s => s.AskAboutFindingAsync(
                It.IsAny<FindingAskRequest>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
