using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PolicyPackSchemaKeysResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "keys": null,
              "tree": null
            }
            """;

        PolicyPackSchemaKeysResponse response =
            JsonSerializer.Deserialize<PolicyPackSchemaKeysResponse>(json, ContractJson.Default)!;

        response.Keys.Should().NotBeNull().And.BeEmpty();
        response.Tree.Should().NotBeNull().And.BeEmpty();
    }
}
