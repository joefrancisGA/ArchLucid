using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Operations;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Operations;

[Trait("Category", "Unit")]
public sealed class TrialFunnelDeserializationTests
{
    [Fact]
    public void Deserialize_null_operational_summary_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "activeSelfServiceTrials": 0,
              "signupAttempts30Days": 0,
              "signupFailures30Days": 0,
              "firstCommittedReviews30Days": 0,
              "trialConversions30Days": 0,
              "billingCheckouts30Days": 0,
              "llmBudgetCutoffEvents30Days": 0,
              "stages": null,
              "cohortRows": null
            }
            """;

        TrialFunnelOperationalSummaryResponse response =
            JsonSerializer.Deserialize<TrialFunnelOperationalSummaryResponse>(json, ContractJson.CamelCaseCompact)!;

        response.Stages.Should().NotBeNull().And.BeEmpty();
        response.CohortRows.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_data_quality_stage_definitions_yields_empty_list_not_null()
    {
        const string json = """
            {
              "generatedAtUtc": "2026-10-15T00:00:00Z",
              "periodDays": 30,
              "comparePreviousPeriod": false,
              "conversionDefinition": "signup",
              "stageDefinitions": null
            }
            """;

        TrialFunnelDataQualityResponse response =
            JsonSerializer.Deserialize<TrialFunnelDataQualityResponse>(json, ContractJson.CamelCaseCompact)!;

        response.StageDefinitions.Should().NotBeNull().And.BeEmpty();
    }
}
