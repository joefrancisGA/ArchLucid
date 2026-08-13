using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Host.Core.ProblemDetails;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Tests.ProblemDetails;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AuthorityRunProblemLadderTests
{
    /// <summary>Minimal controller so the ladder can call the <c>ControllerBase</c> problem extensions.</summary>
    private sealed class TestController : ControllerBase
    {
    }

    private static TestController CreateController()
    {
        DefaultHttpContext httpContext = new();
        httpContext.Request.Path = "/v1/architecture/review/run-1/execute/async";

        return new TestController
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext }
        };
    }

    private static Microsoft.AspNetCore.Mvc.ProblemDetails ProblemFrom(IActionResult result)
    {
        ObjectResult objectResult = result.Should().BeOfType<ObjectResult>().Subject;

        return objectResult.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
    }

    [Fact]
    public void CanMap_accepts_a_missing_run()
    {
        AuthorityRunProblemLadder.CanMap(new RunNotFoundException("run-1")).Should().BeTrue();
    }

    [Fact]
    public void CanMap_accepts_a_conflict()
    {
        AuthorityRunProblemLadder.CanMap(new ConflictException("Run already committed.")).Should().BeTrue();
    }

    [Fact]
    public void CanMap_accepts_a_bad_argument()
    {
        AuthorityRunProblemLadder.CanMap(new ArgumentException("runId is required.")).Should().BeTrue();
    }

    [Fact]
    public void CanMap_accepts_an_invalid_operation()
    {
        AuthorityRunProblemLadder.CanMap(new InvalidOperationException("Run is not executable.")).Should().BeTrue();
    }

    [Fact]
    public void CanMap_rejects_exceptions_outside_the_ladder()
    {
        AuthorityRunProblemLadder.CanMap(new TimeoutException("slow")).Should().BeFalse();
    }

    [Fact]
    public void CanMap_rejects_null()
    {
        AuthorityRunProblemLadder.CanMap(null).Should().BeFalse();
    }

    [Fact]
    public void Map_answers_missing_run_with_404_run_not_found()
    {
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            ProblemFrom(AuthorityRunProblemLadder.Map(CreateController(), new RunNotFoundException("run-1")));

        problem.Status.Should().Be(StatusCodes.Status404NotFound);
        problem.Type.Should().Be(ProblemTypes.RunNotFound);
        problem.Detail.Should().Contain("run-1");
    }

    /// <summary>
    ///     Guards the arm order: <see cref="ConflictException" /> derives from <see cref="InvalidOperationException" />,
    ///     so a reordered switch would answer 400 here instead of 409.
    /// </summary>
    [Fact]
    public void Map_answers_conflict_with_409_before_the_invalid_operation_arm()
    {
        Microsoft.AspNetCore.Mvc.ProblemDetails problem = ProblemFrom(
            AuthorityRunProblemLadder.Map(CreateController(), new ConflictException("Run already committed.")));

        problem.Status.Should().Be(StatusCodes.Status409Conflict);
        problem.Type.Should().Be(ProblemTypes.Conflict);
    }

    [Fact]
    public void Map_answers_bad_argument_with_400_validation_failed()
    {
        Microsoft.AspNetCore.Mvc.ProblemDetails problem = ProblemFrom(
            AuthorityRunProblemLadder.Map(CreateController(), new ArgumentException("runId is required.")));

        problem.Status.Should().Be(StatusCodes.Status400BadRequest);
        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
    }

    [Fact]
    public void Map_answers_invalid_operation_with_400_bad_request()
    {
        Microsoft.AspNetCore.Mvc.ProblemDetails problem = ProblemFrom(
            AuthorityRunProblemLadder.Map(CreateController(), new InvalidOperationException("Run is not executable.")));

        problem.Status.Should().Be(StatusCodes.Status400BadRequest);
        problem.Type.Should().Be(ProblemTypes.BadRequest);
    }

    [Fact]
    public void Map_rejects_an_exception_outside_the_ladder()
    {
        Action map = () => AuthorityRunProblemLadder.Map(CreateController(), new TimeoutException("slow"));

        map.Should().Throw<ArgumentException>().WithMessage("*TimeoutException*");
    }

    [Fact]
    public void Map_rejects_a_null_controller()
    {
        Action map = () => AuthorityRunProblemLadder.Map(null!, new ArgumentException("boom"));

        map.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Map_rejects_a_null_exception()
    {
        Action map = () => AuthorityRunProblemLadder.Map(CreateController(), null!);

        map.Should().Throw<ArgumentNullException>();
    }
}
