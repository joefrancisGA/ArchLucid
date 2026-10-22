using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Requests;

[Trait("Category", "Unit")]
public sealed class RephraseClarificationAnswersInputDeserializationTests
{
    [Fact]
    public void Deserialize_null_items_yields_empty_list_not_null()
    {
        const string json = """
            {
              "items": null
            }
            """;

        RephraseClarificationAnswersInput? result =
            JsonSerializer.Deserialize<RephraseClarificationAnswersInput>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Items.Should().NotBeNull().And.BeEmpty();
    }
}
