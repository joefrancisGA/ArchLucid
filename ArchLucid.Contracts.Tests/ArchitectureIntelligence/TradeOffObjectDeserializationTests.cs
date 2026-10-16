using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class TradeOffObjectDeserializationTests
{
    [Fact]
    public void Deserialize_null_competing_positions_yields_empty_list_not_null()
    {
        const string json = """
            {
              "tradeOffId": "t-1",
              "proposedDecision": "d",
              "benefit": "b",
              "costOrRisk": "c",
              "competingPositions": null
            }
            """;

        TradeOffObject? tradeOff =
            JsonSerializer.Deserialize<TradeOffObject>(json, ContractJson.CamelCaseCompact);

        tradeOff.Should().NotBeNull();
        tradeOff!.CompetingPositions.Should().NotBeNull().And.BeEmpty();
    }
}
