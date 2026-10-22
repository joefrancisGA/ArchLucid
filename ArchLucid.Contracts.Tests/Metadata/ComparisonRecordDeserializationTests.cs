using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Metadata;

[Trait("Category", "Unit")]
public sealed class ComparisonRecordDeserializationTests
{
    [Fact]
    public void Deserialize_null_tags_yields_empty_list_not_null()
    {
        const string json = """
            {
              "tags": null
            }
            """;

        ComparisonRecord? result =
            JsonSerializer.Deserialize<ComparisonRecord>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Tags.Should().NotBeNull().And.BeEmpty();
    }
}
