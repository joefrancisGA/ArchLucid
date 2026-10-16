using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureShareListResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_shares_yields_empty_list_not_null()
    {
        const string json = """
            {
              "shares": null
            }
            """;

        ArchitectureShareListResponse? result =
            JsonSerializer.Deserialize<ArchitectureShareListResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Shares.Should().NotBeNull().And.BeEmpty();
    }
}
