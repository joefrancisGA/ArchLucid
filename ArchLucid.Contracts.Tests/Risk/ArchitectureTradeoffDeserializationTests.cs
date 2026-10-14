using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Risk;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Risk;

[Trait("Category", "Unit")]
public sealed class ArchitectureTradeoffDeserializationTests
{
    [Fact]
    public void Deserialize_integer_out_of_range_status_throws()
    {
        const string json = """
            {
              "gainedPillar": 0,
              "sacrificedPillar": 1,
              "mechanism": "cost-reliability/single-region",
              "status": 99,
              "consequence": 0,
              "reversibility": 0
            }
            """;

        Action act = () => JsonSerializer.Deserialize<ArchitectureTradeoff>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_integer_out_of_range_gained_pillar_throws()
    {
        const string json = """
            {
              "gainedPillar": 99,
              "sacrificedPillar": 1,
              "mechanism": "cost-reliability/single-region",
              "status": 0,
              "consequence": 0,
              "reversibility": 0
            }
            """;

        Action act = () => JsonSerializer.Deserialize<ArchitectureTradeoff>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_defined_status()
    {
        const string json = """
            {
              "gainedPillar": 0,
              "sacrificedPillar": 1,
              "mechanism": "cost-reliability/single-region",
              "status": 2,
              "consequence": 1,
              "reversibility": 2
            }
            """;

        ArchitectureTradeoff tradeoff = JsonSerializer.Deserialize<ArchitectureTradeoff>(json, ContractJson.Default)!;

        tradeoff.Status.Should().Be(TradeoffStatus.Conflicting);
        tradeoff.Consequence.Should().Be(RiskConsequence.Medium);
        tradeoff.Reversibility.Should().Be(ReversibilityClass.OneWayDoor);
    }

    [Fact]
    public void Deserialize_null_evidence_collections_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "gainedPillar": 0,
              "sacrificedPillar": 1,
              "mechanism": "cost-reliability/single-region",
              "evidenceNodeIds": null,
              "evidenceFindingIds": null,
              "status": 0,
              "consequence": 0,
              "reversibility": 0
            }
            """;

        ArchitectureTradeoff tradeoff = JsonSerializer.Deserialize<ArchitectureTradeoff>(json, ContractJson.Default)!;

        tradeoff.EvidenceNodeIds.Should().NotBeNull().And.BeEmpty();
        tradeoff.EvidenceFindingIds.Should().NotBeNull().And.BeEmpty();
    }
}
