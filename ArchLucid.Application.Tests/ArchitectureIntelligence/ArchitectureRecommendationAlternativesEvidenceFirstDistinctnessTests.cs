using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRecommendationAlternativesEvidenceFirstDistinctnessTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void BuildRecommendations_privacy_compliance_indeterminate_alternatives_are_distinct_from_proposed_change()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding finding = new()
        {
            FindingId = "privacy-indeterminate",
            Dimension = QualityDimension.PrivacyCompliance,
            Title = "Compliance signals without documented obligations",
            Rationale = "Compliance or jurisdiction language appears in the model, but no ComplianceObligation element records applicable controls.",
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
            ["Compliance"]).Single();

        recommendation.ProposedChange.Should().Contain("Collect additional evidence");

        recommendation.AlternativeOptions.Should().OnlyContain(option =>
            !RestatesCollectEvidenceBeforeDesignChange(recommendation.ProposedChange, option.Path));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void BuildRecommendations_integration_indeterminate_alternatives_are_distinct_from_proposed_change()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding finding = new()
        {
            FindingId = "integration-indeterminate",
            Dimension = QualityDimension.Integration,
            Title = "External dependencies mentioned without interface documentation",
            Rationale = "Third-party or external API language appears in the model, but no Interface element documents those dependencies.",
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
            ["Integration"]).Single();

        recommendation.ProposedChange.Should().Contain("Collect additional evidence");

        recommendation.AlternativeOptions.Should().OnlyContain(option =>
            !RestatesCollectEvidenceBeforeDesignChange(recommendation.ProposedChange, option.Path));
    }

    private static bool RestatesCollectEvidenceBeforeDesignChange(string proposedChange, string alternativePath)
    {
        return proposedChange.Contains("Collect additional evidence", StringComparison.OrdinalIgnoreCase)
            && alternativePath.Contains("Collect additional evidence", StringComparison.OrdinalIgnoreCase)
            && alternativePath.Contains("before changing the design", StringComparison.OrdinalIgnoreCase);
    }
}
