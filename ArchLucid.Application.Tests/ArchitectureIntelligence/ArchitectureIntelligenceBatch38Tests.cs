using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureIntelligenceBatch38Tests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void SpecialistReviewService_indeterminate_performance_when_load_without_capacity()
    {
        SpecialistReviewService sut = new();
        ArchitectureKnowledgeModel model = CreateModel(
            new ArchitectureModelElement
            {
                ElementId = "load",
                Kind = ArchitectureElementKind.Constraint,
                Name = "Expected 10,000 concurrent users at peak",
            });

        SpecialistReviewResult result = sut.Review(model, [QualityDimension.PerformanceScalability]);

        SpecialistReviewFinding finding = result.Findings.Single();
        finding.Conclusion.Should().Be(ReviewConclusion.Indeterminate);
        finding.Title.Should().Contain("capacity");
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void SpecialistReviewService_fails_data_architecture_when_sensitive_data_has_no_flow()
    {
        SpecialistReviewService sut = new();
        ArchitectureKnowledgeModel model = CreateModel(
            new ArchitectureModelElement
            {
                ElementId = "pii",
                Kind = ArchitectureElementKind.Constraint,
                Name = "Stores customer PII in the application database",
            });

        SpecialistReviewResult result = sut.Review(model, [QualityDimension.DataArchitecture]);

        SpecialistReviewFinding finding = result.Findings.Single();
        finding.Conclusion.Should().Be(ReviewConclusion.Fail);
        finding.Title.Should().ContainEquivalentOf("data flow");
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void ArchitectureModelDiffApplier_adds_recovery_constraint_for_reliability_recommendation()
    {
        ArchitectureModelDiffApplier sut = new();
        ArchitectureKnowledgeModel before = CreateModel(
            new ArchitectureModelElement
            {
                ElementId = "rto",
                Kind = ArchitectureElementKind.RecoveryObjective,
                Name = "RTO 30 minutes",
            });

        ArchitectureRecommendation recommendation = new()
        {
            RecommendationId = "rec-1",
            Problem = "Stated recovery objective may not be achievable",
            ProposedChange = "Align backup, replication, or failover with the stated RTO and record a recovery test.",
            AffectedRequirementOrQualityAttribute = QualityDimension.Reliability.ToString(),
            Confidence = 0.75,
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.SystemProposed,
                SupportStatus = SupportStatus.IndirectlySupported,
                Confidence = 0.75,
            },
        };

        ArchitectureModelDiff diff = sut.ApplyRecommendation(before, recommendation);

        diff.Entries.Should().Contain(entry =>
            entry.ElementKind == ArchitectureElementKind.Constraint
            && entry.ChangeKind == "Added");
        diff.AfterModel.Elements.Should().Contain(element =>
            element.Kind == ArchitectureElementKind.Constraint
            && element.Name.Contains("recovery", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void BuildRecommendations_adds_security_reliability_trade_off_when_both_fail()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding securityFinding = new()
        {
            FindingId = "sec",
            Dimension = QualityDimension.Security,
            Title = "Public endpoint lacks documented trust boundary",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };
        SpecialistReviewFinding reliabilityFinding = new()
        {
            FindingId = "rel",
            Dimension = QualityDimension.Reliability,
            Title = "Stated recovery objective may not be achievable",
            Rationale = "RTO conflict",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [securityFinding, reliabilityFinding],
            ["Security", "Reliability"]);

        recommendations.Should().HaveCountGreaterThan(0);
        recommendations.Should().Contain(recommendation =>
            recommendation.TradeOffs.Any(tradeOff =>
                tradeOff.CompetingPositions.Contains("Security-first")
                && tradeOff.CompetingPositions.Contains("Availability-first")));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void BuildRecommendations_uses_dimension_specific_alternatives_for_data_gap()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding finding = new()
        {
            FindingId = "data",
            Dimension = QualityDimension.DataArchitecture,
            Title = "Sensitive data mentioned without documented data flows",
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel { ModelId = "m", TenantId = "t" },
            [finding],
            ["Compliance"]);

        recommendations.Single().Alternatives.Should().Contain("Document data flows for sensitive data paths before production");
    }

    private static ArchitectureKnowledgeModel CreateModel(params ArchitectureModelElement[] elements)
    {
        return new ArchitectureKnowledgeModel
        {
            ModelId = Guid.NewGuid().ToString("N"),
            TenantId = Guid.NewGuid().ToString("N"),
            Elements = elements.ToList(),
        };
    }
}
