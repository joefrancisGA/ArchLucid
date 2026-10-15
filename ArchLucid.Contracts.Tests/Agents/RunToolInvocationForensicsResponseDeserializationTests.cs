using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class RunToolInvocationForensicsResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_rows_yields_empty_list_not_null()
    {
        const string json = """
            {
              "runId": "run-1",
              "rows": null
            }
            """;

        RunToolInvocationForensicsResponse response =
            JsonSerializer.Deserialize<RunToolInvocationForensicsResponse>(json, ContractJson.CamelCaseCompact)!;

        response.Rows.Should().NotBeNull().And.BeEmpty();
    }
}
