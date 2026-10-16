using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class GoldenArchitectureTestResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_metric_collections_yields_empty_collections_not_null()
    {
        const string json = """
            {
              "plantedDefectRecall": 0,
              "plantedDefectsDetected": null,
              "plantedDefectsMissed": null,
              "falsePositiveCount": 0,
              "categoryScores": null,
              "beforeCounts": null,
              "afterCounts": null,
              "deltaCounts": null,
              "falsePositivesByDimension": null
            }
            """;

        GoldenArchitectureTestResult? result =
            JsonSerializer.Deserialize<GoldenArchitectureTestResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.PlantedDefectsDetected.Should().NotBeNull().And.BeEmpty();
        result.PlantedDefectsMissed.Should().NotBeNull().And.BeEmpty();
        result.CategoryScores.Should().NotBeNull().And.BeEmpty();
        result.BeforeCounts.Should().NotBeNull().And.BeEmpty();
        result.AfterCounts.Should().NotBeNull().And.BeEmpty();
        result.DeltaCounts.Should().NotBeNull().And.BeEmpty();
        result.FalsePositivesByDimension.Should().NotBeNull().And.BeEmpty();
    }
}
