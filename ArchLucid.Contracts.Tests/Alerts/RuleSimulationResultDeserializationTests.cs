using System.Text.Json;

using ArchLucid.Contracts.Alerts.Simulation;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Alerts;

[Trait("Category", "Unit")]
public sealed class RuleSimulationResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "ruleKind": "composite",
              "summaryNotes": null,
              "outcomes": null
            }
            """;

        RuleSimulationResult? result =
            JsonSerializer.Deserialize<RuleSimulationResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.SummaryNotes.Should().NotBeNull().And.BeEmpty();
        result.Outcomes.Should().NotBeNull().And.BeEmpty();
    }
}
