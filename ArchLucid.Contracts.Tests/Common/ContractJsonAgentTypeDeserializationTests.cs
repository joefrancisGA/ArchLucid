using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Common;

[Trait("Category", "Unit")]
public sealed class ContractJsonAgentTypeDeserializationTests
{
    [Fact]
    public void Default_options_maps_dispatch_key_on_trace_summary()
    {
        const string json = """
            {
              "traceId": "abc",
              "runId": "run-1",
              "taskId": "task-1",
              "agentType": "topology"
            }
            """;

        AgentExecutionTraceSummary? summary = JsonSerializer.Deserialize<AgentExecutionTraceSummary>(json, ContractJson.Default);

        summary.Should().NotBeNull();
        summary!.AgentType.Should().Be(AgentType.Topology);
    }

    [Fact]
    public void Default_options_integer_out_of_range_throws_for_agent_type_property()
    {
        const string json = """
            {
              "traceId": "abc",
              "runId": "run-1",
              "taskId": "task-1",
              "agentType": 99
            }
            """;

        Action act = () => JsonSerializer.Deserialize<AgentExecutionTraceSummary>(json, ContractJson.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown agent type value*");
    }

    [Fact]
    public void Default_options_string_numeric_out_of_range_throws_for_standalone_agent_type()
    {
        Action act = () => JsonSerializer.Deserialize<AgentType>("\"99\"", ContractJson.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown agent type value*");
    }
}
