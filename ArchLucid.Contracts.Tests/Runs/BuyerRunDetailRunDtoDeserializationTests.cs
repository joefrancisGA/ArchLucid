using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Runs;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Runs;

[Trait("Category", "Unit")]
public sealed class BuyerRunDetailRunDtoDeserializationTests
{
    [Fact]
    public void Deserialize_null_degraded_execution_agents_yields_empty_list_not_null()
    {
        const string json = """
            {
              "runId": "00000000-0000-0000-0000-000000000001",
              "scopeProjectId": "00000000-0000-0000-0000-000000000002",
              "projectId": "p",
              "degradedExecutionAgents": null
            }
            """;

        BuyerRunDetailRunDto? run =
            JsonSerializer.Deserialize<BuyerRunDetailRunDto>(json, ContractJson.CamelCaseCompact);

        run.Should().NotBeNull();
        run!.DegradedExecutionAgents.Should().NotBeNull().And.BeEmpty();
    }
}
