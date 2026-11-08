using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingRecordMetadataPageDeserializationTests
{
    [Fact]
    public void Deserialize_null_items_yields_empty_list_not_null()
    {
        const string json = """
            {
              "items": null,
              "hasMore": false
            }
            """;

        FindingRecordMetadataPage? page =
            JsonSerializer.Deserialize<FindingRecordMetadataPage>(json, ContractJson.CamelCaseCompact);

        page.Should().NotBeNull();
        page!.Items.Should().NotBeNull().And.BeEmpty();
        page.HasMore.Should().BeFalse();
    }
}
