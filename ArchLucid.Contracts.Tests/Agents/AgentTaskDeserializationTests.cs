using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class AgentTaskDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "taskId": "t1",
              "runId": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              "agentType": 1,
              "allowedTools": null,
              "allowedSources": null
            }
            """;

        AgentTask task = JsonSerializer.Deserialize<AgentTask>(json, ContractJson.Default)!;

        task.AllowedTools.Should().NotBeNull().And.BeEmpty();
        task.AllowedSources.Should().NotBeNull().And.BeEmpty();
    }
}
