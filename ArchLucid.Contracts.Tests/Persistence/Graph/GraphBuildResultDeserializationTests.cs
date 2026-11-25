using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.Graph;

[Trait("Category", "Unit")]
public sealed class GraphBuildResultDeserializationTests
{
    [Fact]
    public void Deserialize_populated_lists_preserves_build_output()
    {
        const string json = """
            {
              "nodes": [{ "nodeId": "source" }, { "nodeId": "target" }],
              "edges": [{ "edgeId": "link", "fromNodeId": "source", "toNodeId": "target", "edgeType": "depends" }],
              "warnings": ["partial model"]
            }
            """;

        GraphBuildResult? result = JsonSerializer.Deserialize<GraphBuildResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Nodes.Select(static node => node.NodeId).Should().Equal("source", "target");
        GraphEdge edge = result.Edges.Should().ContainSingle().Which;
        (edge.EdgeId, edge.FromNodeId, edge.ToNodeId, edge.EdgeType).Should().Be(("link", "source", "target", "depends"));
        result.Warnings.Should().Equal("partial model");
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

        GraphBuildResult? result =
            JsonSerializer.Deserialize<GraphBuildResult>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Nodes.Should().NotBeNull().And.BeEmpty();
        result.Edges.Should().NotBeNull().And.BeEmpty();
        result.Warnings.Should().NotBeNull().And.BeEmpty();
    }
}
