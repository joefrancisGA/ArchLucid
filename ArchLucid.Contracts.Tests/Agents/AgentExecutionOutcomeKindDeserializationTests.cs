using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class AgentExecutionOutcomeKindDeserializationTests
{
    [Fact]
    public void Deserialize_defined_outcome_via_buyer_summary_shape()
    {
        const string json = """{"agentType":1,"outcome":1}""";

        AgentExecutionOutcome outcome = JsonSerializer.Deserialize<AgentExecutionOutcome>(json, ContractJson.Default)!;

        outcome.Outcome.Should().Be(AgentExecutionOutcomeKind.Succeeded);
    }

    [Fact]
    public void Deserialize_whole_number_double_outcome_maps_integer()
    {
        const string json = """{"agentType":1,"outcome":1.0}""";

        AgentExecutionOutcome outcome = JsonSerializer.Deserialize<AgentExecutionOutcome>(json, ContractJson.Default)!;

        outcome.Outcome.Should().Be(AgentExecutionOutcomeKind.Succeeded);
    }

    [Fact]
    public void Deserialize_integer_out_of_range_outcome_throws()
    {
        const string json = """{"agentType":1,"outcome":99}""";

        Action act = () => JsonSerializer.Deserialize<AgentExecutionOutcome>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_string_numeric_out_of_range_outcome_throws()
    {
        const string json = """{"agentType":1,"outcome":"99"}""";

        Action act = () => JsonSerializer.Deserialize<AgentExecutionOutcome>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }
}
