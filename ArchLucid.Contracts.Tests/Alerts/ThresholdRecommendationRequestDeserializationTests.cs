using System.Text.Json;

using ArchLucid.Contracts.Alerts.Tuning;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Alerts;

[Trait("Category", "Unit")]
public sealed class ThresholdRecommendationRequestDeserializationTests
{
    [Fact]
    public void Deserialize_null_candidate_thresholds_yields_empty_list_not_null()
    {
        const string json = """
            {
              "ruleKind": "simple",
              "tunedMetricType": "noise",
              "candidateThresholds": null
            }
            """;

        ThresholdRecommendationRequest? result =
            JsonSerializer.Deserialize<ThresholdRecommendationRequest>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.CandidateThresholds.Should().NotBeNull().And.BeEmpty();
    }
}
