using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class RecentPilotRunDeltasResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_items_yields_empty_list_not_null()
    {
        const string json = """
            {
              "items": null,
              "requestedCount": 5,
              "returnedCount": 0
            }
            """;

        RecentPilotRunDeltasResponse? response =
            JsonSerializer.Deserialize<RecentPilotRunDeltasResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Items.Should().NotBeNull().And.BeEmpty();
    }
}
