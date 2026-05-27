using ArchLucid.Core.Manifest;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Manifest;

[Trait("Category", "Unit")]
public sealed class DecisionConfidenceSourceMapperTests
{
    [Theory]
    [InlineData(DecisionConfidenceSource.FindingEvaluation, BuyerDecisionConfidenceSource.EvidenceBacked)]
    [InlineData(DecisionConfidenceSource.RuleEngine, BuyerDecisionConfidenceSource.EvidenceBacked)]
    [InlineData(DecisionConfidenceSource.LlmAgent, BuyerDecisionConfidenceSource.ModelAssisted)]
    [InlineData(DecisionConfidenceSource.Unknown, BuyerDecisionConfidenceSource.Unknown)]
    [InlineData(DecisionConfidenceSource.NotComputed, BuyerDecisionConfidenceSource.Unknown)]
    public void ToBuyerLabel_maps_internal_sources(DecisionConfidenceSource source, string expected)
    {
        DecisionConfidenceSourceMapper.ToBuyerLabel(source).Should().Be(expected);
    }

    [Fact]
    public void ToBuyerLabel_parses_persisted_enum_name()
    {
        DecisionConfidenceSourceMapper.ToBuyerLabel("LlmAgent").Should().Be(BuyerDecisionConfidenceSource.ModelAssisted);
    }
}
