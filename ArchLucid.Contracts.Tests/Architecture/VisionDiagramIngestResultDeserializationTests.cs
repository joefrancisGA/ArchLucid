using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class VisionDiagramIngestResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_warnings_yields_empty_list_not_null()
    {
        const string json = """
            {
              "model": { "nodes": [], "edges": [] },
              "warnings": null
            }
            """;

        VisionDiagramIngestResult result =
            JsonSerializer.Deserialize<VisionDiagramIngestResult>(json, ContractJson.Default)!;

        result.Warnings.Should().NotBeNull();
        result.Warnings.Should().BeEmpty();
    }
}
