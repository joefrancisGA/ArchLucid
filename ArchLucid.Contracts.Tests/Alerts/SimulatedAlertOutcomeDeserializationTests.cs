using System.Text.Json;

using ArchLucid.Contracts.Alerts.Simulation;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Alerts;

[Trait("Category", "Unit")]
public sealed class SimulatedAlertOutcomeDeserializationTests
{
    [Fact]
    public void Deserialize_null_notes_yields_empty_list_not_null()
    {
        const string json = """
            {
              "notes": null
            }
            """;

        SimulatedAlertOutcome? result =
            JsonSerializer.Deserialize<SimulatedAlertOutcome>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Notes.Should().NotBeNull().And.BeEmpty();
    }
}
