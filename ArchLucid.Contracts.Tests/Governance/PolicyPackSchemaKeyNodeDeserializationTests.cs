using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PolicyPackSchemaKeyNodeDeserializationTests
{
    [Fact]
    public void Deserialize_null_children_yields_empty_list_not_null()
    {
        const string json = """
            {
              "children": null
            }
            """;

        PolicyPackSchemaKeyNode? result =
            JsonSerializer.Deserialize<PolicyPackSchemaKeyNode>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Children.Should().NotBeNull().And.BeEmpty();
    }
}
