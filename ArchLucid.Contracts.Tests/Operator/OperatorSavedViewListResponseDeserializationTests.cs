using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Operator;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Operator;

[Trait("Category", "Unit")]
public sealed class OperatorSavedViewListResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_views_yields_empty_list_not_null()
    {
        const string json = """
            {
              "views": null
            }
            """;

        OperatorSavedViewListResponse? result =
            JsonSerializer.Deserialize<OperatorSavedViewListResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Views.Should().NotBeNull().And.BeEmpty();
    }
}
