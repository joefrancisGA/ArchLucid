using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClosedLoopRecommendationBriefGroundingFilterTests
{
    [Fact]
    public void FilterGroundedRecommendations_drops_https_contradicting_proposal()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req-1",
            Constraints = ["All traffic must use HTTPS only"],
        };

        List<ArchitectureRecommendation> recommendations =
        [
            new ArchitectureRecommendation
            {
                RecommendationId = "rec-http",
                ProposedChange = "Expose the API over http://legacy.example.com for compatibility.",
                Problem = "Legacy clients",
                Evidence = "Survey",
                ConsequenceOfInaction = "Delay",
                ValidationMethod = "Review",
            },
            new ArchitectureRecommendation
            {
                RecommendationId = "rec-ok",
                ProposedChange = "Terminate TLS at the gateway with managed certificates.",
                Problem = "Ingress hardening",
                Evidence = "Baseline",
                ConsequenceOfInaction = "Risk",
                ValidationMethod = "Review",
            },
        ];

        List<ArchitectureRecommendation> grounded =
            ClosedLoopRecommendationBriefGroundingFilter.FilterGroundedRecommendations(recommendations, request);

        grounded.Should().ContainSingle(recommendation => recommendation.RecommendationId == "rec-ok");
    }

    [Fact]
    public void FilterGroundedRecommendations_returns_all_when_no_confirmed_brief_rules()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req-2",
            Constraints = ["Unknown: TBD"],
        };

        List<ArchitectureRecommendation> recommendations =
        [
            new ArchitectureRecommendation
            {
                RecommendationId = "rec-1",
                ProposedChange = "Use http://internal-only",
                Problem = "Cost",
                Evidence = "Note",
                ConsequenceOfInaction = "Spend",
                ValidationMethod = "Review",
            },
        ];

        List<ArchitectureRecommendation> grounded =
            ClosedLoopRecommendationBriefGroundingFilter.FilterGroundedRecommendations(recommendations, request);

        grounded.Should().HaveCount(1);
    }
}
