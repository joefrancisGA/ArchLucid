using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRecommendationProposedChangeTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void Build_uses_concrete_security_change_for_public_endpoint_gap()
    {
        SpecialistReviewFinding finding = new()
        {
            FindingId = "f-1",
            Dimension = QualityDimension.Security,
            Title = "Public endpoint lacks documented trust boundary",
            Rationale = "Public API without trust boundary.",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        string proposedChange = ArchitectureRecommendationProposedChange.Build(finding);

        proposedChange.Should().NotContain("Address finding:");
        proposedChange.Should().Contain("trust boundary");
        proposedChange.Should().Contain("authentication");
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void BuildRecommendations_uses_concrete_proposed_change()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding finding = new()
        {
            FindingId = "f-rel",
            Dimension = QualityDimension.Reliability,
            Title = "Stated recovery objective may not be achievable",
            Rationale = "RTO 30 minutes vs 4-hour backup.",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel
            {
                ModelId = "m",
                TenantId = "t",
            },
            [finding],
            ["Reliability"]);

        recommendations.Should().ContainSingle();
        recommendations[0].ProposedChange.Should().Contain("stated RTO");
        recommendations[0].ProposedChange.Should().NotContain("Address finding:");
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void BuildRecommendations_indeterminate_insufficient_evidence_uses_suggestion_not_must_change()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding finding = new()
        {
            FindingId = "f-indeterminate",
            Dimension = QualityDimension.Security,
            Title = "Public endpoint lacks documented trust boundary",
            Rationale = "No trust-boundary element is recorded for the public API.",
            Conclusion = ReviewConclusion.Indeterminate,
            EvidenceCondition = EvidenceCondition.Insufficient,
            Severity = "Medium",
            Confidence = 0.5,
        };

        ArchitectureRecommendation recommendation = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel
            {
                ModelId = "m",
                TenantId = "t",
            },
            [finding],
            ["Security"]).Single();

        recommendation.ProposedChange.Should().Contain("Collect additional evidence");
        recommendation.ProposedChange.Should().NotContain("require authentication");
        recommendation.ProposedChange.Should().NotContain("before production exposure");
        recommendation.ValidationMethod.Should().Contain("Attach evidence artifacts");
        recommendation.AlternativeOptions.Select(option => option.Path).Should().NotContain(path =>
            path.Contains("private network", StringComparison.OrdinalIgnoreCase)
            || path.Contains("API gateway", StringComparison.OrdinalIgnoreCase));
        recommendation.AlternativeOptions.Should().Contain(option =>
            option.Path.Contains("discovery spike", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void BuildRecommendations_marks_implementation_estimate_unavailable()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding finding = new()
        {
            FindingId = "f-effort",
            Dimension = QualityDimension.Security,
            Title = "Public endpoint lacks documented trust boundary",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [finding],
            ["Security"]);

        recommendations[0].Effort.ImplementationEstimateAvailable.Should().BeFalse();
        recommendations[0].Effort.BasisNotes.Should().Contain("implementation estimate unavailable");
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void BuildRecommendations_omits_pass_and_not_applicable_findings_from_recommendations()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding passSecurity = new()
        {
            FindingId = "f-pass",
            Dimension = QualityDimension.Security,
            Title = "Controls satisfied for public API",
            Rationale = "Reviewed",
            Conclusion = ReviewConclusion.Pass,
            Severity = "Low",
        };

        SpecialistReviewFinding failCost = new()
        {
            FindingId = "f-cost",
            Dimension = QualityDimension.Cost,
            Title = "Spend exceeds stated ceiling",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        SpecialistReviewFinding notApplicableReliability = new()
        {
            FindingId = "f-rel-na",
            Dimension = QualityDimension.Reliability,
            Title = "Recovery review not in scope",
            Rationale = "Out of scope",
            Conclusion = ReviewConclusion.NotApplicable,
            Severity = "Low",
        };

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [passSecurity, failCost, notApplicableReliability],
            ["Security", "Cost", "Reliability"]);

        recommendations.Should().ContainSingle();
        recommendations[0].AffectedRequirementOrQualityAttribute.Should().Be(QualityDimension.Cost.ToString());
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void BuildRecommendations_skips_security_cost_trade_off_when_cost_finding_is_pass()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding securityFinding = new()
        {
            FindingId = "f-sec",
            Dimension = QualityDimension.Security,
            Title = "Public endpoint lacks documented trust boundary",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        SpecialistReviewFinding costPass = new()
        {
            FindingId = "f-cost-pass",
            Dimension = QualityDimension.Cost,
            Title = "Spend within stated ceiling",
            Rationale = "Within budget",
            Conclusion = ReviewConclusion.Pass,
            Severity = "Low",
        };

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [securityFinding, costPass],
            ["Security", "Cost"]);

        recommendations.Should().ContainSingle();
        recommendations[0].TradeOffs.Should().BeEmpty();
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void BuildRecommendations_trims_padded_high_severity_for_effort_band_without_human_approval()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding finding = new()
        {
            FindingId = "f-high-padded",
            Dimension = QualityDimension.Cost,
            Title = "Spend exceeds stated ceiling",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = " High ",
        };

        ArchitectureRecommendation recommendation = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [finding],
            ["Cost"]).Single();

        recommendation.RequiresHumanApproval.Should().BeFalse();
        recommendation.Effort.Band.Should().Be("High");
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void BuildRecommendations_skips_security_cost_trade_off_when_cost_finding_is_not_applicable()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding securityFinding = new()
        {
            FindingId = "f-sec",
            Dimension = QualityDimension.Security,
            Title = "Public endpoint lacks documented trust boundary",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        SpecialistReviewFinding costNotApplicable = new()
        {
            FindingId = "f-cost-na",
            Dimension = QualityDimension.Cost,
            Title = "Cost review not in scope for this package",
            Rationale = "Out of scope",
            Conclusion = ReviewConclusion.NotApplicable,
            Severity = "Low",
        };

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [securityFinding, costNotApplicable],
            ["Security", "Cost"]);

        recommendations.Should().ContainSingle();
        recommendations[0].TradeOffs.Should().BeEmpty();
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void BuildRecommendations_skips_security_cost_trade_off_when_cost_finding_is_indeterminate()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding securityFinding = new()
        {
            FindingId = "f-sec",
            Dimension = QualityDimension.Security,
            Title = "Public endpoint lacks documented trust boundary",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        SpecialistReviewFinding costIndeterminate = new()
        {
            FindingId = "f-cost-ind",
            Dimension = QualityDimension.Cost,
            Title = "Spend may exceed stated ceiling",
            Rationale = "Insufficient cost evidence",
            Conclusion = ReviewConclusion.Indeterminate,
            EvidenceCondition = EvidenceCondition.Insufficient,
            Severity = "Medium",
        };

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [securityFinding, costIndeterminate],
            ["Security", "Cost"]);

        recommendations.Should().HaveCount(2);
        recommendations.Should().OnlyContain(recommendation =>
            recommendation.TradeOffs.Count == 0,
            "evidence-only cost findings must not trigger competing-dimension trade-offs");
        recommendations.Single(recommendation =>
                recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Cost.ToString())
            .ProposedChange.Should().Contain("Collect additional evidence");
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void BuildRecommendations_skips_security_cost_trade_off_when_cost_fail_is_evidence_only()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding securityFinding = new()
        {
            FindingId = "f-sec",
            Dimension = QualityDimension.Security,
            Title = "Public endpoint lacks documented trust boundary",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        SpecialistReviewFinding costFailInsufficient = new()
        {
            FindingId = "f-cost-fail",
            Dimension = QualityDimension.Cost,
            Title = "Spend exceeds stated ceiling",
            Rationale = "No mapped drivers in package",
            Conclusion = ReviewConclusion.Fail,
            EvidenceCondition = EvidenceCondition.Insufficient,
            Severity = "High",
        };

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [securityFinding, costFailInsufficient],
            ["Security", "Cost"]);

        recommendations.Should().HaveCount(2);
        recommendations.Should().OnlyContain(recommendation => recommendation.TradeOffs.Count == 0);
    }

    [Fact]
    public void BuildRecommendations_balances_security_reliability_trade_off_when_priority_mentions_not_reliability()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding securityFinding = new()
        {
            FindingId = "f-sec",
            Dimension = QualityDimension.Security,
            Title = "Public endpoint lacks documented trust boundary",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        SpecialistReviewFinding reliabilityFinding = new()
        {
            FindingId = "f-rel",
            Dimension = QualityDimension.Reliability,
            Title = "Stated recovery objective may not be achievable",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [securityFinding, reliabilityFinding],
            ["not-reliability pilot scope"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Balance Security and Reliability with explicit human approval.");
    }

    [Fact]
    public void BuildRecommendations_balances_security_reliability_trade_off_when_priority_mentions_no_reliability()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding securityFinding = new()
        {
            FindingId = "f-sec",
            Dimension = QualityDimension.Security,
            Title = "Public endpoint lacks documented trust boundary",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        SpecialistReviewFinding reliabilityFinding = new()
        {
            FindingId = "f-rel",
            Dimension = QualityDimension.Reliability,
            Title = "Stated recovery objective may not be achievable",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [securityFinding, reliabilityFinding],
            ["no reliability stretch goals"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Balance Security and Reliability with explicit human approval.");
    }

    [Fact]
    public void BuildRecommendations_balances_reliability_cost_trade_off_when_priority_mentions_not_cost()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding reliabilityFinding = new()
        {
            FindingId = "f-rel",
            Dimension = QualityDimension.Reliability,
            Title = "Stated recovery objective may not be achievable",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        SpecialistReviewFinding costFinding = new()
        {
            FindingId = "f-cost",
            Dimension = QualityDimension.Cost,
            Title = "Spend exceeds stated ceiling",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [reliabilityFinding, costFinding],
            ["not-cost recovery program"]);

        ArchitectureRecommendation reliabilityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Reliability.ToString());

        reliabilityRecommendation.TradeOffs.Should().ContainSingle();
        reliabilityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Balance Reliability and Cost with explicit human approval.");
    }

    [Fact]
    public void BuildRecommendations_balances_security_reliability_trade_off_when_priority_mentions_non_reliability()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding securityFinding = new()
        {
            FindingId = "f-sec",
            Dimension = QualityDimension.Security,
            Title = "Public endpoint lacks documented trust boundary",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        SpecialistReviewFinding reliabilityFinding = new()
        {
            FindingId = "f-rel",
            Dimension = QualityDimension.Reliability,
            Title = "Stated recovery objective may not be achievable",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

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
    public void BuildRecommendations_balances_reliability_cost_trade_off_when_priority_mentions_non_cost()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding reliabilityFinding = new()
        {
            FindingId = "f-rel",
            Dimension = QualityDimension.Reliability,
            Title = "Stated recovery objective may not be achievable",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        SpecialistReviewFinding costFinding = new()
        {
            FindingId = "f-cost",
            Dimension = QualityDimension.Cost,
            Title = "Spend exceeds stated ceiling",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [reliabilityFinding, costFinding],
            ["Non-Cost recovery program"]);

        ArchitectureRecommendation reliabilityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Reliability.ToString());

        reliabilityRecommendation.TradeOffs.Should().ContainSingle();
        reliabilityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Balance Reliability and Cost with explicit human approval.");
    }

    [Fact]
    public void BuildRecommendations_prefers_availability_first_when_priority_explicitly_names_reliability()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding securityFinding = new()
        {
            FindingId = "f-sec",
            Dimension = QualityDimension.Security,
            Title = "Public endpoint lacks documented trust boundary",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        SpecialistReviewFinding reliabilityFinding = new()
        {
            FindingId = "f-rel",
            Dimension = QualityDimension.Reliability,
            Title = "Stated recovery objective may not be achievable",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [securityFinding, reliabilityFinding],
            ["Reliability-first recovery objectives"]);

        ArchitectureRecommendation securityRecommendation = recommendations.Single(
            recommendation => recommendation.AffectedRequirementOrQualityAttribute == QualityDimension.Security.ToString());

        securityRecommendation.TradeOffs.Should().ContainSingle();
        securityRecommendation.TradeOffs[0].RecommendedResolution.Should().Contain(
            "Prioritize availability-first with explicit compensating controls.");
    }

    [Fact]
    public void BuildRecommendations_uses_integration_proposed_change_for_third_party_gap()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding finding = new()
        {
            FindingId = "f-int",
            Dimension = QualityDimension.Integration,
            Title = "Third-party webhook retries are undocumented",
            Rationale = "No failure handling recorded.",
            Conclusion = ReviewConclusion.Fail,
            Severity = "Medium",
        };

        ArchitectureRecommendation recommendation = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [finding],
            ["Integration"]).Single();

        recommendation.ProposedChange.Should().Contain("external interfaces");
        recommendation.ProposedChange.Should().Contain("authentication");
        recommendation.ProposedChange.Should().NotContain("Address finding:");
    }
}
