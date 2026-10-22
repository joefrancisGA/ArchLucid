using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.Graph;

[Trait("Category", "Unit")]
public sealed class GraphEdgeDeserializationTests
{
    [Fact]
    public void Deserialize_null_edge_type_yields_empty_string_not_null()
    {
        const string json = """
            {
              "edgeId": "e1",
              "fromNodeId": "n1",
              "toNodeId": "n2",
              "edgeType": null
            }
            """;

        GraphEdge? result = JsonSerializer.Deserialize<GraphEdge>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.EdgeType.Should().BeEmpty();
    }

    [Fact]
    public void Deserialize_null_to_node_id_yields_empty_string_not_null()
    {
        const string json = """
            {
              "edgeId": "e1",
              "fromNodeId": "n1",
              "toNodeId": null,
              "edgeType": "depends"
            }
            """;

        GraphEdge? result = JsonSerializer.Deserialize<GraphEdge>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.ToNodeId.Should().BeEmpty();
    }

    [Fact]
    public void Deserialize_null_from_node_id_yields_empty_string_not_null()
    {
        const string json = """
            {
              "edgeId": "e1",
              "fromNodeId": null,
              "toNodeId": "n2",
              "edgeType": "depends"
            }
            """;

        GraphEdge? result = JsonSerializer.Deserialize<GraphEdge>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.FromNodeId.Should().BeEmpty();
    }

    [Fact]
    public void Deserialize_null_edge_id_yields_empty_string_not_null()
    {
        const string json = """
            {
              "edgeId": null,
              "fromNodeId": "n1",
              "toNodeId": "n2",
              "edgeType": "depends"
            }
            """;

        GraphEdge? result = JsonSerializer.Deserialize<GraphEdge>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.EdgeId.Should().BeEmpty();
    }

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
