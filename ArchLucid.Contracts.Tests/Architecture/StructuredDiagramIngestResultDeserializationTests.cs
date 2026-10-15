using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class StructuredDiagramIngestResultDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "model": { "nodes": [], "edges": [] },
              "warnings": null,
              "sourceFingerprints": null
            }
            """;

        StructuredDiagramIngestResult result =
            JsonSerializer.Deserialize<StructuredDiagramIngestResult>(json, ContractJson.Default)!;

        result.Warnings.Should().NotBeNull().And.BeEmpty();
        result.SourceFingerprints.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_model_yields_non_null_model_not_null()
    {
        const string json = """
            {
              "model": null
            }
            """;

        StructuredDiagramIngestResult? result =
            JsonSerializer.Deserialize<StructuredDiagramIngestResult>(json, ContractJson.Default);

        result.Should().NotBeNull();
        result!.Model.Should().NotBeNull();
    }
}
