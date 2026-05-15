using ArchLucid.Host.Core.ProblemDetails;

using FluentAssertions;

using MvcProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

namespace ArchLucid.Host.Core.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ProblemSupportHintsTests
{
    [Fact]
    public void AttachForProblemType_noops_when_type_missing()
    {
        MvcProblemDetails problem = new();

        ProblemSupportHints.AttachForProblemType(problem);

        problem.Extensions.Should().NotContainKey("supportHint");
    }

    [Fact]
    public void AttachForProblemType_adds_hint_for_known_run_not_found()
    {
        MvcProblemDetails problem = new() { Type = ProblemTypes.RunNotFound };

        ProblemSupportHints.AttachForProblemType(problem);

        problem.Extensions.Should().ContainKey("supportHint");
        problem.Extensions["supportHint"].Should().BeOfType<string>();
    }

    [Fact]
    public void AttachForProblemType_adds_hint_for_internal_error()
    {
        MvcProblemDetails problem = new() { Type = ProblemTypes.InternalError };

        ProblemSupportHints.AttachForProblemType(problem);

        problem.Extensions["supportHint"].Should().BeOfType<string>();
    }

    [Fact]
    public void AttachForProblemType_throws_when_problem_null()
    {
        Action act = () => ProblemSupportHints.AttachForProblemType(null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
