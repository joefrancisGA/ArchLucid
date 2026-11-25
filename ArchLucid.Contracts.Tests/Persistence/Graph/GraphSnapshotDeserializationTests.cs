using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.Graph;

[Trait("Category", "Unit")]
public sealed class GraphSnapshotDeserializationTests
{
    [Fact]
    public void Deserialize_populated_lists_preserves_graph_data()
    {
        const string json = """
            {
              "graphSnapshotId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              "nodes": [{ "nodeId": "a" }, { "nodeId": "b" }],
              "edges": [{ "edgeId": "e1", "fromNodeId": "a", "toNodeId": "b", "weight": 0.25 }],
              "warnings": ["first", "second"]
            }
            """;

        GraphSnapshot? result = JsonSerializer.Deserialize<GraphSnapshot>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.GraphSnapshotId.Should().Be(Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"));
        result.Nodes.Select(static node => node.NodeId).Should().Equal("a", "b");
        GraphEdge edge = result.Edges.Should().ContainSingle().Which;
        (edge.EdgeId, edge.FromNodeId, edge.ToNodeId, edge.Weight).Should().Be(("e1", "a", "b", 0.25));
        result.Warnings.Should().Equal("first", "second");
    }

    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "nodes": null,
              "edges": null,
              "warnings": null
            }
            """;

        GraphSnapshot? result = JsonSerializer.Deserialize<GraphSnapshot>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Nodes.Should().NotBeNull().And.BeEmpty();
        result.Edges.Should().NotBeNull().And.BeEmpty();
        result.Warnings.Should().NotBeNull().And.BeEmpty();
    }
}
