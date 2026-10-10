using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureIntelligenceLlmResponseMapperMissingValueTests
{
    [Fact]
    public void MapRecommendation_labels_missing_recommendation_values_without_defaulting_them()
    {
        ArchitectureRecommendation recommendation = ArchitectureIntelligenceLlmResponseMapper.MapRecommendation(
            new ArchitectureIntelligenceLlmResponseShapes.RecommendationShape
            {
                Problem = "Problem",
                ProposedChange = "Change",
                ValidationMethod = null,
                EffortBand = null,
                RiskReductionLevel = null,
            });

        recommendation.ValidationMethod.Should().Be("Validation method was not stored.");
        recommendation.Effort.Band.Should().Be("Effort band was not stored.");
        recommendation.Effort.ImplementationEstimateAvailable.Should().BeFalse();
        recommendation.RiskReduction.Level.Should().Be("Risk reduction was not stored.");
    }
}
