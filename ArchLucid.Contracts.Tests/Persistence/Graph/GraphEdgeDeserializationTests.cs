using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.Graph;

[Trait("Category", "Unit")]
public sealed class GraphEdgeDeserializationTests
{
    [Fact]
    public void Deserialize_null_properties_yields_empty_dictionary_not_null()
    {
        const string json = """
            {
              "edgeId": "e1",
              "fromNodeId": "n1",
              "toNodeId": "n2",
              "edgeType": "depends",
              "properties": null
            }
            """;

        GraphEdge? result = JsonSerializer.Deserialize<GraphEdge>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Properties.Should().NotBeNull().And.BeEmpty();
    }
}
