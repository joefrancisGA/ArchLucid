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
    public void BuildRecommendations_prefers_security_first_when_priority_uses_unicode_hyphen_in_cost_effective()
    {
        const string unicodeHyphenPriority = "Cost\u2011effective security program";
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
            [unicodeHyphenPriority]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_cost_conscious_security_program()
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
            ["cost-conscious security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_cost_effective_security_program()
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
            ["Cost-effective security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
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
    public void BuildRecommendations_balances_security_cost_trade_off_when_priority_says_do_not_prioritize_security()
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
            ["Do not prioritize security in phase one"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Balance Security and Cost with explicit human approval.");
    }

    [Fact]
    public void BuildRecommendations_balances_security_cost_trade_off_when_priority_says_security_is_not_a_priority()
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
            ["Security is not a priority for phase one"]);

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
    public void BuildRecommendations_prefers_security_first_when_priority_is_operating_cost_security_program()
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
            ["operating cost security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_fully_loaded_cost_security_program()
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
            ["fully loaded cost security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_total_landed_cost_security_program()
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
            ["total landed cost security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_cost_of_ownership_security_program()
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
            ["cost of ownership security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_cost_of_quality_security_program()
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
            ["cost of quality security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_balances_security_and_cost_when_priority_says_deprioritize_cost()
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
            ["Deprioritize Cost"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Be(
            "Balance Security and Cost with explicit human approval.");
    }

    [Fact]
    public void BuildRecommendations_balances_security_and_cost_when_priority_negates_security_over_cost()
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
            ["Do not prefer Security over Cost"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Be(
            "Balance Security and Cost with explicit human approval.");
    }

    [Fact]
    public void BuildRecommendations_keeps_later_explicit_pair_after_declared_priority_normalization()
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
        IReadOnlyList<string> normalized = ClosedLoopDeclaredPrioritiesNormalizer.Normalize(
            ["Security over Cost", "Cost over Security"]);

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [securityFinding, costFinding],
            normalized);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Be(
            "Prioritize cost-first with explicit compensating controls.");
    }

    [Fact]
    public void BuildRecommendations_prefers_reliability_first_when_priority_is_cost_of_reliability_program()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding reliabilityFinding = CreateFailFinding(
            "rel",
            QualityDimension.Reliability,
            "Stated recovery objective may not be achievable");
        SpecialistReviewFinding costFinding = CreateFailFinding(
            "cost",
            QualityDimension.Cost,
            "Spend exceeds stated ceiling");

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [reliabilityFinding, costFinding],
            ["cost of reliability program"]);

        ArchitectureRecommendation reliabilityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Reliability.ToString());

        reliabilityRecommendation.TradeOffs.Should().ContainSingle();
        reliabilityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize recovery-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_price_of_security_program()
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
            ["price of security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_reliability_first_when_priority_is_price_of_reliability_with_cost_containment()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding reliabilityFinding = CreateFailFinding(
            "rel",
            QualityDimension.Reliability,
            "Stated recovery objective may not be achievable");
        SpecialistReviewFinding costFinding = CreateFailFinding(
            "cost",
            QualityDimension.Cost,
            "Spend exceeds stated ceiling");

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [reliabilityFinding, costFinding],
            ["price of reliability; cost containment"]);

        ArchitectureRecommendation reliabilityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Reliability.ToString());

        reliabilityRecommendation.TradeOffs.Should().ContainSingle();
        reliabilityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize recovery-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_security_over_cost_precedes_security_hardening_bullet()
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
            ["Security over Cost", "Security hardening for phase one"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_cost_of_security_program()
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
            ["cost of security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_security_over_cost_precedes_cost_control_bullet()
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
            ["Security over Cost", "cost control for shared services"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_security_over_cost_precedes_reliability_uplift()
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
            ["Security over Cost", "Reliability uplift"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_sunk_cost_security_program()
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
            ["sunk cost security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_lifecycle_cost_security_program()
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
            ["lifecycle cost security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_security_over_cost_precedes_reliability_only_bullets()
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
            ["Operations excellence", "Security over Cost", "Reliability focus for phase two"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_opportunity_cost_security_program()
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
            ["opportunity cost security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_capital_cost_security_program()
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
            ["capital cost security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_cost_first_when_last_explicit_pair_is_cost_over_security()
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
            ["Reliability over Cost", "Security over Cost", "Cost over Security"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize cost-first with explicit compensating controls.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_variable_cost_security_program()
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
            ["variable cost security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_incremental_cost_security_program()
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
            ["incremental cost security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_reliability_framing_precedes_security_over_cost()
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
            ["Reliability over Cost for phase one", "Security over Cost"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_per_user_cost_security_program()
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
            ["per user cost security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_cost_first_when_explicit_pair_precedes_later_generic_security_uplift()
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
            ["Cost over Security", "Security uplift"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize cost-first with explicit compensating controls.");
    }

    [Fact]
    public void BuildRecommendations_prefers_cost_first_when_priority_is_bare_cost_with_security_and_cost_findings()
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
            ["Cost"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize cost-first with explicit compensating controls.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_unit_cost_security_program()
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
            ["unit cost security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_total_cost_security_program()
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
            ["total cost security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_cost_first_when_explicit_pair_follows_unrelated_priority_bullets()
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
            ["Operations excellence", "Security focus for phase one", "Cost over Security"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize cost-first with explicit compensating controls.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_for_cost_security_program()
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
            ["for cost security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_cost_center_security_program()
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
            ["cost center security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_semicolon_joined_priority_lists_security_over_cost_first()
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
            ["Security over Cost; Cost over Security"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_at_cost_security_rollout()
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
            ["at cost security rollout"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_cost_governance_security_program()
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
            ["cost governance security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_cost_first_when_generic_security_uplift_precedes_cost_over_security()
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
            ["Security uplift", "Cost over Security"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize cost-first with explicit compensating controls.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_low_cost_security_program()
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
            ["low cost security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_cost_management_security_program()
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
            ["cost management security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_cost_first_when_later_priority_has_matching_explicit_pair()
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
            ["Reliability over Cost", "Cost over Security"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize cost-first with explicit compensating controls.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_cost_savings_security_program()
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
            ["cost savings security program"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_says_security_before_cost()
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
            ["Security before Cost"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_cost_first_when_priority_says_cost_before_security()
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
            ["Cost before Security"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize cost-first with explicit compensating controls.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_cost_control_security_uplift()
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
            ["cost control security uplift"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_uses_declared_priority_rationale_when_explicit_pair_overrides_generic_mentions()
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
            ["Security focus for phase one", "Cost over Security"]);

        TradeOffObject tradeOff = recommendations
            .Single(recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString())
            .TradeOffs
            .Should()
            .ContainSingle()
            .Subject;

        tradeOff.ResolutionRationale.Should().Be(
            "Declared priorities were used to resolve competing Security and Cost findings.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_comma_joined_priority_lists_security_over_cost_first()
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
            ["Security over Cost, Cost over Security"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_cost_first_when_later_priority_explicitly_says_cost_over_security()
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
            ["Security focus for phase one", "Cost over Security"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize cost-first with explicit compensating controls.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_is_cost_optimized_security_rollout()
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
            ["cost optimized security rollout"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
    }

    [Fact]
    public void BuildRecommendations_prefers_security_first_when_priority_says_security_over_cost()
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
            ["Security over Cost"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize security-first over cost-first.");
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
    public void BuildRecommendations_balances_security_cost_when_separate_priorities_each_name_a_dimension_first()
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
            ["Security-first", "Cost-first"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Balance Security and Cost with explicit human approval.");
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
