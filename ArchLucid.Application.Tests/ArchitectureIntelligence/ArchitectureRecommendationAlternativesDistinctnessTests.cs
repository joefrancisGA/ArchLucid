using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRecommendationAlternativesDistinctnessTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void BuildRecommendations_data_architecture_alternatives_are_distinct_from_proposed_change()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding finding = new()
        {
            FindingId = "data",
            Dimension = QualityDimension.DataArchitecture,
            Title = "Sensitive data mentioned without documented data flows",
            Rationale = "Sensitive or customer data is referenced in the model, but no DataFlow element maps movement or storage.",
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
            ["Compliance"]).Single();

        recommendation.ProposedChange.Should().Contain("Document data flows for sensitive data paths");

        recommendation.AlternativeOptions.Should().OnlyContain(option =>
            !RestatesDocumentSensitiveDataFlows(recommendation.ProposedChange, option.Path));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void BuildRecommendations_cost_ceiling_alternatives_are_distinct_from_proposed_change()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding finding = new()
        {
            FindingId = "cost",
            Dimension = QualityDimension.Cost,
            Title = "Stated cost ceiling is not reflected in cost drivers",
            Rationale = "Cost drivers omit the stated monthly ceiling.",
            Conclusion = ReviewConclusion.Fail,
            Severity = "Medium",
        };

        ArchitectureRecommendation recommendation = sut.BuildRecommendations(
            new ArchitectureKnowledgeModel
            {
                ModelId = "m",
                TenantId = "t",
            },
            [finding],
            ["Cost"]).Single();

        recommendation.ProposedChange.Should().Contain("guardrails");

        recommendation.AlternativeOptions.Should().OnlyContain(option =>
            !RestatesMapCostDriversToCeiling(recommendation.ProposedChange, option.Path));
    }

    private static bool RestatesDocumentSensitiveDataFlows(string proposedChange, string alternativePath)
    {
        return proposedChange.Contains("Document data flows for sensitive data paths", StringComparison.OrdinalIgnoreCase)
            && alternativePath.Contains("Document data flows for sensitive data paths", StringComparison.OrdinalIgnoreCase);
    }

    private static bool RestatesMapCostDriversToCeiling(string proposedChange, string alternativePath)
    {
        return proposedChange.Contains("Map", StringComparison.OrdinalIgnoreCase)
            && proposedChange.Contains("cost drivers", StringComparison.OrdinalIgnoreCase)
            && proposedChange.Contains("ceiling", StringComparison.OrdinalIgnoreCase)
            && alternativePath.Contains("Map cost drivers", StringComparison.OrdinalIgnoreCase)
            && alternativePath.Contains("ceiling", StringComparison.OrdinalIgnoreCase);
    }
}
