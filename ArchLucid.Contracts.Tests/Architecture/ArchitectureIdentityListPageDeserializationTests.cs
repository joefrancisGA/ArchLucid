using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureIdentityListPageDeserializationTests
{
    [Fact]
    public void Deserialize_null_items_yields_empty_list_not_null()
    {
        const string json = """
            {
              "items": null
            }
            """;

        ArchitectureIdentityListPage? result =
            JsonSerializer.Deserialize<ArchitectureIdentityListPage>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Items.Should().NotBeNull().And.BeEmpty();
    }
}
