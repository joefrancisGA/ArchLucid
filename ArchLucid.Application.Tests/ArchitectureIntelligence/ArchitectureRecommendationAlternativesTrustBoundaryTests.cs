using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRecommendationAlternativesTrustBoundaryTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void BuildRecommendations_non_public_trust_boundary_gap_does_not_emit_public_exposure_alternatives()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding finding = new()
        {
            FindingId = "f-internal-tb",
            Dimension = QualityDimension.Security,
            Title = "Internal tier trust boundary is undocumented",
            Rationale = "No trust-boundary element separates application and data tiers.",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        ArchitectureRecommendation recommendation = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel
            {
                ModelId = "m",
                TenantId = "t",
            },
            [finding],
            ["Security"]).Single();

        recommendation.ProposedChange.Should().Contain("Close the security gap");
        recommendation.ProposedChange.Should().NotContain("before production exposure");

        recommendation.AlternativeOptions.Select(option => option.Path).Should().NotContain(path =>
            path.Contains("private network", StringComparison.OrdinalIgnoreCase)
            || path.Contains("API gateway", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Build_non_public_trust_boundary_title_does_not_return_public_remediation_paths()
    {
        IReadOnlyList<RecommendationAlternative> alternatives =
            ArchitectureRecommendationAlternatives.Build(new SpecialistReviewFinding
            {
                FindingId = "f-internal-tb",
                Dimension = QualityDimension.Security,
                Title = "Internal tier trust boundary is undocumented",
                Rationale = "Gap",
                Conclusion = ReviewConclusion.Fail,
                Severity = "High",
            });

        alternatives.Select(option => option.Path).Should().NotContain(path =>
            path.Contains("private network", StringComparison.OrdinalIgnoreCase)
            || path.Contains("public internet", StringComparison.OrdinalIgnoreCase)
            || path.Contains("API gateway", StringComparison.OrdinalIgnoreCase));
    }
}
