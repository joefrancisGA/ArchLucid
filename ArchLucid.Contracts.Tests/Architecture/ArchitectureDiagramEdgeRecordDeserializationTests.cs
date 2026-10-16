using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureDiagramEdgeRecordDeserializationTests
{
    [Fact]
    public void Deserialize_null_properties_yields_empty_dictionary_not_null()
    {
        const string json = """
            {
              "id": "e1",
              "sourceId": "a",
              "targetId": "b",
              "properties": null
            }
            """;

        ArchitectureDiagramEdgeRecord? result =
            JsonSerializer.Deserialize<ArchitectureDiagramEdgeRecord>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Properties.Should().NotBeNull().And.BeEmpty();
    }
}
