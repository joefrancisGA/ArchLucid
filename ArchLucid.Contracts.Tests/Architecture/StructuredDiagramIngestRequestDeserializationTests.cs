using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class StructuredDiagramIngestRequestDeserializationTests
{
    [Fact]
    public void Deserialize_null_sources_yields_empty_list_not_null()
    {
        const string json = """
            {
              "sources": null
            }
            """;

        StructuredDiagramIngestRequest request =
            JsonSerializer.Deserialize<StructuredDiagramIngestRequest>(json, ContractJson.Default)!;

        request.Sources.Should().NotBeNull();
        request.Sources.Should().BeEmpty();
    }
}
