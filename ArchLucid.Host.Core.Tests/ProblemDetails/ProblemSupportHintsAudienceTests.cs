using ArchLucid.Host.Core.ProblemDetails;

using FluentAssertions;

using MvcProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

namespace ArchLucid.Host.Core.Tests.ProblemDetails;

[Trait("Category", "Unit")]
public sealed class ProblemSupportHintsAudienceTests
{
    [Fact]
    public void Buyer_tier_graph_too_large_hint_does_not_contain_v1_route()
    {
        MvcProblemDetails problem = new() { Type = ProblemTypes.GraphTooLargeForFullResponse };

        ProblemSupportHints.AttachForProblemType(problem, ProblemDetailsAudience.Buyer);

        problem.Extensions.Should().ContainKey("supportHint");
        string hint = problem.Extensions["supportHint"].Should().BeOfType<string>().Subject;
        hint.Should().NotContain("GET /v1/");
        hint.Should().NotContain("/v1/");
    }

    [Fact]
    public void Operator_tier_graph_too_large_hint_may_contain_v1_route()
    {
        MvcProblemDetails problem = new() { Type = ProblemTypes.GraphTooLargeForFullResponse };

        ProblemSupportHints.AttachForProblemType(problem, ProblemDetailsAudience.Operator);

        problem.Extensions.Should().ContainKey("supportHint");
        string hint = problem.Extensions["supportHint"].Should().BeOfType<string>().Subject;
        hint.Should().Contain("/v1/");
    }

    [Fact]
    public void Validation_hint_never_mentions_swagger_for_buyer_or_operator()
    {
        MvcProblemDetails buyerProblem = new() { Type = ProblemTypes.ValidationFailed };
        ProblemSupportHints.AttachForProblemType(buyerProblem, ProblemDetailsAudience.Buyer);
        string buyerHint = buyerProblem.Extensions["supportHint"].Should().BeOfType<string>().Subject;
        buyerHint.ToLowerInvariant().Should().NotContain("swagger");

        MvcProblemDetails operatorProblem = new() { Type = ProblemTypes.ValidationFailed };
        ProblemSupportHints.AttachForProblemType(operatorProblem, ProblemDetailsAudience.Operator);
        string operatorHint = operatorProblem.Extensions["supportHint"].Should().BeOfType<string>().Subject;
        operatorHint.ToLowerInvariant().Should().NotContain("swagger");
    }

    [Fact]
    public void Buyer_tier_packaging_hint_does_not_contain_checkout_route()
    {
        MvcProblemDetails problem = new() { Type = ProblemTypes.PackagingTierInsufficient };

        ProblemSupportHints.AttachForProblemType(problem, ProblemDetailsAudience.Buyer);

        string hint = problem.Extensions["supportHint"].Should().BeOfType<string>().Subject;
        hint.Should().NotContain("billing/checkout");
        hint.Should().NotContain("POST /v1/");
    }
}
