using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureRecommendationAlternativesReliabilityDistinctnessTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void BuildRecommendations_reliability_recovery_alternatives_are_distinct_from_proposed_change()
    {
        ArchitectureRecommendationEngine sut = new();
        SpecialistReviewFinding finding = new()
        {
            FindingId = "rel-recovery",
            Dimension = QualityDimension.Reliability,
            Title = "Stated recovery objective may not be achievable",
            Rationale = "RTO 30 minutes vs 4-hour backup.",
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
            ["Reliability"]).Single();

        recommendation.ProposedChange.Should().Contain("RTO");
        recommendation.ProposedChange.Should().Contain("backup");

        recommendation.AlternativeOptions.Should().OnlyContain(option =>
            !RestatesAlignBackupReplicationRto(recommendation.ProposedChange, option.Path));
    }

    private static bool RestatesAlignBackupReplicationRto(string proposedChange, string alternativePath)
    {
        return proposedChange.Contains("RTO", StringComparison.OrdinalIgnoreCase)
            && proposedChange.Contains("backup", StringComparison.OrdinalIgnoreCase)
            && proposedChange.Contains("replication", StringComparison.OrdinalIgnoreCase)
            && alternativePath.Contains("RTO", StringComparison.OrdinalIgnoreCase)
            && alternativePath.Contains("backup", StringComparison.OrdinalIgnoreCase)
            && alternativePath.Contains("replication", StringComparison.OrdinalIgnoreCase);
    }
}
