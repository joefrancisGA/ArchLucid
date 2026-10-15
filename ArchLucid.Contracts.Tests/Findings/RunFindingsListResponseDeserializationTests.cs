using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class RunFindingsListResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_items_yields_empty_list_not_null()
    {
        const string json = """
            {
              "runId": "run-1",
              "items": null
            }
            """;

        RunFindingsListResponse? response =
            JsonSerializer.Deserialize<RunFindingsListResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Items.Should().NotBeNull().And.BeEmpty();
    }
}
