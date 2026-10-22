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
              "items": null
            }
            """;

        RecentPilotRunDeltasResponse? result =
            JsonSerializer.Deserialize<RecentPilotRunDeltasResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Items.Should().NotBeNull().And.BeEmpty();
    }
}
