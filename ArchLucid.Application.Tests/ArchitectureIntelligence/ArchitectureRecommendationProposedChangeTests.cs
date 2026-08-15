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
}
