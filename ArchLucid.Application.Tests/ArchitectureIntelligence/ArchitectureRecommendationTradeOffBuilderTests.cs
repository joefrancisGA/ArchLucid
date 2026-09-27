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

    [Fact]
    public void BuildRecommendations_balances_security_cost_trade_off_when_priority_mentions_non_security()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding securityFinding = CreateFailFinding(
            "sec",
            QualityDimension.Security,
            "Public endpoint lacks documented trust boundary");
        SpecialistReviewFinding costFinding = CreateFailFinding(
            "cost",
            QualityDimension.Cost,
            "Spend exceeds stated ceiling");

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [securityFinding, costFinding],
            ["Non-Security compliance scope"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Balance Security and Cost with explicit human approval.");
    }

    [Fact]
    public void BuildRecommendations_does_not_treat_costa_rica_priority_as_cost_first()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding securityFinding = CreateFailFinding(
            "sec",
            QualityDimension.Security,
            "Public endpoint lacks documented trust boundary");
        SpecialistReviewFinding costFinding = CreateFailFinding(
            "cost",
            QualityDimension.Cost,
            "Spend exceeds stated ceiling");

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [securityFinding, costFinding],
            ["Costa Rica deployment region"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Balance Security and Cost with explicit human approval.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_explicitly_names_security()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding securityFinding = CreateFailFinding(
            "sec",
            QualityDimension.Security,
            "Public endpoint lacks documented trust boundary");
        SpecialistReviewFinding costFinding = CreateFailFinding(
            "cost",
            QualityDimension.Cost,
            "Spend exceeds stated ceiling");

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [securityFinding, costFinding],
            ["Security-first delivery"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
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
