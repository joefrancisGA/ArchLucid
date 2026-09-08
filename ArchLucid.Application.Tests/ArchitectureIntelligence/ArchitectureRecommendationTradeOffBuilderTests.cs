using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRecommendationTradeOffBuilderTests
{
    [Fact]
    public void BuildRecommendations_security_cost_trade_off_stays_on_security_recommendation_when_cost_is_first()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding costFinding = CreateFailFinding(
            "cost",
            QualityDimension.Cost,
            "Monthly ceiling is unspecified");
        SpecialistReviewFinding securityFinding = CreateFailFinding(
            "sec",
            QualityDimension.Security,
            "Public endpoint lacks documented trust boundary");

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [costFinding, securityFinding],
            ["Security", "Cost"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());
        ArchitectureRecommendation costRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Cost.ToString());

        securityRecommendation.TradeOffs.Should().Contain(tradeOff =>
            tradeOff.CompetingPositions.Contains("Security-first")
            && tradeOff.CompetingPositions.Contains("Cost-first"));
        costRecommendation.TradeOffs.Should().NotContain(tradeOff =>
            tradeOff.CompetingPositions.Contains("Security-first")
            && tradeOff.CompetingPositions.Contains("Cost-first"));
    }

    private static SpecialistReviewFinding CreateFailFinding(
        string findingId,
        QualityDimension dimension,
        string title)
    {
        return new SpecialistReviewFinding
        {
            FindingId = findingId,
            Dimension = dimension,
            Title = title,
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };
    }
}
