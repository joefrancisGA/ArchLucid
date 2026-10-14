using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class AgentOutputQualityGateOutcomeDeserializationTests
{
    [Fact]
    public void Deserialize_integer_out_of_range_aggregate_quality_gate_outcome_throws()
    {
        const string json = """
            {
              "authority": "recorded",
              "aggregateQualityGateOutcome": 99
            }
            """;

        Action act = () => JsonSerializer.Deserialize<AgentOutputEvaluationPerspective>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_string_numeric_out_of_range_aggregate_quality_gate_outcome_throws()
    {
        const string json = """
            {
              "authority": "recorded",
              "aggregateQualityGateOutcome": "99"
            }
            """;

        Action act = () => JsonSerializer.Deserialize<AgentOutputEvaluationPerspective>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_defined_aggregate_quality_gate_outcome()
    {
        const string json = """
            {
              "authority": "recorded",
              "aggregateQualityGateOutcome": 1
            }
            """;

        AgentOutputEvaluationPerspective perspective =
            JsonSerializer.Deserialize<AgentOutputEvaluationPerspective>(json, ContractJson.Default)!;

        perspective.AggregateQualityGateOutcome.Should().Be(AgentOutputQualityGateOutcome.Warned);
    }
}
