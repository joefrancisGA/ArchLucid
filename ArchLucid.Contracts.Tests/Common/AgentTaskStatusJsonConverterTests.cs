using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Common;

[Trait("Category", "Unit")]
public sealed class AgentTaskStatusJsonConverterTests
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    [Theory]
    [InlineData("1", AgentTaskStatus.Created)]
    [InlineData("\"Completed\"", AgentTaskStatus.Completed)]
    public void Read_maps_defined_values(string json, AgentTaskStatus expected)
    {
        AgentTaskStatus value = JsonSerializer.Deserialize<AgentTaskStatus>(json, Options);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<AgentTaskStatus>("99", Options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown agent task status value*");
    }

    [Fact]
    public void AgentTask_rejects_out_of_range_status_ordinal()
    {
        const string json = """
                            {
                              "taskId": "task-1",
                              "runId": "run-1",
                              "agentType": 1,
                              "status": 99
                            }
                            """;

        Action act = () => JsonSerializer.Deserialize<AgentTask>(json, Options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown agent task status value*");
    }
}
