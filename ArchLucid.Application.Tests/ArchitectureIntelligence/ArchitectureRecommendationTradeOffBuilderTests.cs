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
    public void BuildRecommendations_does_not_treat_unicode_word_containing_security_as_security_first()
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
            ["Securityüberwachung"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Balance Security and Cost with explicit human approval.");
    }

    [Fact]
    public void BuildRecommendations_balances_security_cost_trade_off_when_priority_mentions_no_cost()
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
            ["no-cost deployment pilot"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Balance Security and Cost with explicit human approval.");
    }

    [Fact]
    public void BuildRecommendations_balances_security_cost_trade_off_when_priority_mentions_not_cost()
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
            ["not-cost deployment pilot"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Balance Security and Cost with explicit human approval.");
    }

    [Fact]
    public void BuildRecommendations_prefers_cost_first_when_priority_mentions_low_cost_design()
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
            ["Low-Cost design target"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize cost-first with explicit compensating controls.");
    }

    [Fact]
    public void BuildRecommendations_balances_security_cost_trade_off_when_priority_mentions_non_cost()
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
            ["Non-Cost architecture review"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Balance Security and Cost with explicit human approval.");
    }

    [Fact]
    public void BuildRecommendations_balances_security_reliability_trade_off_when_priority_mentions_non_reliability()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding securityFinding = CreateFailFinding(
            "sec",
            QualityDimension.Security,
            "Public endpoint lacks documented trust boundary");
        SpecialistReviewFinding reliabilityFinding = CreateFailFinding(
            "rel",
            QualityDimension.Reliability,
            "Stated recovery objective may not be achievable");

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [securityFinding, reliabilityFinding],
            ["Non-Reliability pilot scope"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Balance Security and Reliability with explicit human approval.");
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

    [Fact]
    public void BuildRecommendations_does_not_claim_priorities_resolved_a_trade_off_when_none_select_either_dimension()
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
        SpecialistReviewFinding reliabilityFinding = CreateFailFinding(
            "rel",
            QualityDimension.Reliability,
            "Stated recovery objective may not be achievable");

        IReadOnlyList<ArchitectureRecommendation> securityCost = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [securityFinding, costFinding],
            ["Operations excellence"]);

        TradeOffObject securityCostTradeOff = securityCost
            .Single(recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString())
            .TradeOffs
            .Should()
            .ContainSingle()
            .Subject;
        securityCostTradeOff.RecommendedResolution.Should().Be(
            "Balance Security and Cost with explicit human approval.");
        securityCostTradeOff.ResolutionRationale.Should().Be(
            "No declared priority selected Security or Cost, so the competing findings stay balanced.");

        IReadOnlyList<ArchitectureRecommendation> reliabilityCost = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [reliabilityFinding, costFinding],
            []);

        TradeOffObject reliabilityCostTradeOff = reliabilityCost
            .Single(recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Reliability.ToString())
            .TradeOffs
            .Should()
            .ContainSingle()
            .Subject;
        reliabilityCostTradeOff.RecommendedResolution.Should().Be(
            "Balance Reliability and Cost with explicit human approval.");
        reliabilityCostTradeOff.ResolutionRationale.Should().Be(
            "No declared priority selected Reliability or Cost, so the competing findings stay balanced.");
    }

    [Fact]
    public void BuildRecommendations_reuses_trade_off_id_when_rebuilding_same_findings()
    {
        SpecialistReviewFinding securityFinding = CreateFailFinding(
            "sec",
            QualityDimension.Security,
            "Public endpoint lacks documented trust boundary");
        SpecialistReviewFinding costFinding = CreateFailFinding(
            "cost",
            QualityDimension.Cost,
            "Spend exceeds stated ceiling");
        ArchitectureRecommendationEngine sut = new();

        string firstTradeOffId = sut.BuildRecommendations(
                new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
                [securityFinding, costFinding],
                ["Security"])
            .Single(recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString())
            .TradeOffs
            .Single()
            .TradeOffId;
        string secondTradeOffId = sut.BuildRecommendations(
                new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
                [securityFinding, costFinding],
                ["Security"])
            .Single(recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString())
            .TradeOffs
            .Single()
            .TradeOffId;

        secondTradeOffId.Should().Be(firstTradeOffId);
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
