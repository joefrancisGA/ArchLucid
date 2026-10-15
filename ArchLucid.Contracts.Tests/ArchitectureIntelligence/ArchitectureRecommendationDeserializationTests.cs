using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ArchitectureRecommendationDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "recommendationId": "rec-1",
              "problem": "p",
              "evidence": "e",
              "affectedRequirementOrQualityAttribute": "a",
              "consequenceOfInaction": "c",
              "proposedChange": "x",
              "alternatives": null,
              "alternativeOptions": null,
              "tradeOffs": null,
              "dependencies": null,
              "validationMethod": "v",
              "confidence": 0.5
            }
            """;

        ArchitectureRecommendation? recommendation =
            JsonSerializer.Deserialize<ArchitectureRecommendation>(json, ContractJson.CamelCaseCompact);

        recommendation.Should().NotBeNull();
        recommendation!.Alternatives.Should().NotBeNull().And.BeEmpty();
        recommendation.AlternativeOptions.Should().NotBeNull().And.BeEmpty();
        recommendation.TradeOffs.Should().NotBeNull().And.BeEmpty();
        recommendation.Dependencies.Should().NotBeNull().And.BeEmpty();
    }
}
