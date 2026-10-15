using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.Graph;

[Trait("Category", "Unit")]
public sealed class GraphNodeDeserializationTests
{
    [Fact]
    public void Deserialize_null_label_yields_empty_string_not_null()
    {
        const string json = """
            {
              "nodeId": "n1",
              "nodeType": "service",
              "label": null
            }
            """;

        GraphNode? result = JsonSerializer.Deserialize<GraphNode>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Label.Should().BeEmpty();
    }

    [Fact]
    public void Deserialize_null_node_type_yields_empty_string_not_null()
    {
        const string json = """
            {
              "nodeId": "n1",
              "nodeType": null,
              "label": "svc"
            }
            """;

        GraphNode? result = JsonSerializer.Deserialize<GraphNode>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.NodeType.Should().BeEmpty();
    }

    [Fact]
    public void Deserialize_null_node_id_yields_empty_string_not_null()
    {
        const string json = """
            {
              "nodeId": null,
              "nodeType": "service",
              "label": "svc"
            }
            """;

        GraphNode? result = JsonSerializer.Deserialize<GraphNode>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.NodeId.Should().BeEmpty();
    }

    [Fact]
    public void Deserialize_null_properties_yields_empty_dictionary_not_null()
    {
        const string json = """
            {
              "nodeId": "n1",
              "nodeType": "service",
              "label": "svc",
              "properties": null
            }
            """;

        GraphNode? result = JsonSerializer.Deserialize<GraphNode>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Properties.Should().NotBeNull().And.BeEmpty();
    }
}
