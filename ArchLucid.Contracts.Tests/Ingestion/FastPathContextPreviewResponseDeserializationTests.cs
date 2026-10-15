using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Ingestion;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Ingestion;

[Trait("Category", "Unit")]
public sealed class FastPathContextPreviewResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_elements_yields_empty_list_not_null()
    {
        const string json = """
            {
              "elements": null
            }
            """;

        FastPathContextPreviewResponse? response =
            JsonSerializer.Deserialize<FastPathContextPreviewResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Elements.Should().NotBeNull().And.BeEmpty();
    }
}
