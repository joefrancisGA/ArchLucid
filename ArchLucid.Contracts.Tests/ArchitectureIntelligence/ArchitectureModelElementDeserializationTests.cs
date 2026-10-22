using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ArchitectureModelElementDeserializationTests
{
    [Fact]
    public void Deserialize_null_reference_collections_yields_empty_collections_not_null()
    {
        const string json = """
            {
              "elementId": "el-1",
              "kind": 0,
              "name": "n",
              "sourcePassageIds": null,
              "relatedElementIds": null,
              "properties": null
            }
            """;

        ArchitectureModelElement? element =
            JsonSerializer.Deserialize<ArchitectureModelElement>(json, ContractJson.CamelCaseCompact);

        element.Should().NotBeNull();
        element!.SourcePassageIds.Should().NotBeNull().And.BeEmpty();
        element.RelatedElementIds.Should().NotBeNull().And.BeEmpty();
        element.Properties.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_provenance_yields_non_null_provenance_not_null()
    {
        const string json = """
            {
              "elementId": "el-1",
              "kind": 0,
              "name": "n",
              "provenance": null
            }
            """;

        ArchitectureModelElement? element =
            JsonSerializer.Deserialize<ArchitectureModelElement>(json, ContractJson.CamelCaseCompact);

        element.Should().NotBeNull();
        element!.Provenance.Should().NotBeNull();
    }
}
