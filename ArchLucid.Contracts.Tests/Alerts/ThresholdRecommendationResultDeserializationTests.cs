using System.Text.Json;

using ArchLucid.Contracts.Alerts.Tuning;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Alerts;

[Trait("Category", "Unit")]
public sealed class ThresholdRecommendationResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "ruleKind": "composite",
              "tunedMetricType": "noise",
              "summaryNotes": null,
              "candidates": null
            }
            """;

        ThresholdRecommendationResult? result =
            JsonSerializer.Deserialize<ThresholdRecommendationResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.SummaryNotes.Should().NotBeNull().And.BeEmpty();
        result.Candidates.Should().NotBeNull().And.BeEmpty();
    }
}
