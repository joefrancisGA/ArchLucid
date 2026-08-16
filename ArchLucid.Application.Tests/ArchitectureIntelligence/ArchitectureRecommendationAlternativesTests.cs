using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRecommendationAlternativesTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void Build_returns_security_trust_boundary_paths()
    {
        IReadOnlyList<RecommendationAlternative> alternatives =
            ArchitectureRecommendationAlternatives.Build(CreateFinding(
                QualityDimension.Security,
                "Public endpoint lacks documented trust boundary"));

        alternatives.Should().HaveCount(2);
        alternatives[0].Path.Should().Contain("private network");
        alternatives[0].ValidationCriteria.Should().Contain("public internet");
        alternatives[1].Path.Should().Contain("trust boundary");
        alternatives[1].ValidationCriteria.Should().Contain("authentication");
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Build_returns_reliability_recovery_paths()
    {
        IReadOnlyList<RecommendationAlternative> alternatives =
            ArchitectureRecommendationAlternatives.Build(CreateFinding(
                QualityDimension.Reliability,
                "Stated recovery objective may not be achievable"));

        alternatives.Should().HaveCount(2);
        alternatives[0].Path.Should().Contain("RTO");
        alternatives[1].Path.Should().Contain("sponsor");
        alternatives.Should().OnlyContain(option => !string.IsNullOrWhiteSpace(option.ValidationCriteria));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Build_returns_cost_ceiling_paths()
    {
        IReadOnlyList<RecommendationAlternative> alternatives =
            ArchitectureRecommendationAlternatives.Build(CreateFinding(
                QualityDimension.Cost,
                "Monthly ceiling is unspecified"));

        alternatives[0].Path.Should().Contain("guardrails");
        alternatives[1].Path.Should().Contain("ceiling");
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Build_returns_data_architecture_paths()
    {
        IReadOnlyList<RecommendationAlternative> alternatives =
            ArchitectureRecommendationAlternatives.Build(CreateFinding(
                QualityDimension.DataArchitecture,
                "Sensitive data flows are undocumented"));

        alternatives[0].Path.Should().Contain("sensitive data");
        alternatives[1].Path.Should().Contain("classification");
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Build_returns_performance_capacity_paths()
    {
        IReadOnlyList<RecommendationAlternative> alternatives =
            ArchitectureRecommendationAlternatives.Build(CreateFinding(
                QualityDimension.PerformanceScalability,
                "Peak load is unspecified"));

        alternatives[0].Path.Should().Contain("capacity expectation");
        alternatives[1].Path.Should().Contain("load targets");
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Build_returns_default_paths_for_other_dimensions()
    {
        IReadOnlyList<RecommendationAlternative> alternatives =
            ArchitectureRecommendationAlternatives.Build(CreateFinding(
                QualityDimension.Maintainability,
                "Module coupling is high"));

        alternatives[0].Path.Should().Contain("exception");
        alternatives[1].Path.Should().Contain("additional evidence");
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void BuildRecommendations_mirrors_alternative_option_paths()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding finding = CreateFinding(
            QualityDimension.Security,
            "Public endpoint lacks documented trust boundary");

        IReadOnlyList<ArchitectureRecommendation> recommendations = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel
            {
                ModelId = "m",
                TenantId = "t",
            },
            [finding],
            ["Security"]);

        recommendations.Should().ContainSingle();
        recommendations[0].AlternativeOptions.Should().NotBeEmpty();
        recommendations[0].Alternatives.Should().Equal(
            recommendations[0].AlternativeOptions.Select(option => option.Path));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Build_throws_when_finding_is_null()
    {
        Action act = () => ArchitectureRecommendationAlternatives.Build(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("finding");
    }

    private static SpecialistReviewFinding CreateFinding(QualityDimension dimension, string title)
    {
        return new SpecialistReviewFinding
        {
            FindingId = "f-alt",
            Dimension = dimension,
            Title = title,
            Rationale = "Gap",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };
    }
}
