using ArchLucid.Application.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class GraphGcpInventoryReconciliationAnalyzerTests
{
    private const string GraphResourceId =
        "projects/demo-project/zones/us-central1-a/instances/graph-vm";

    private const string InventoryResourceId =
        "projects/demo-project/global/networks/live-vpc";

    [Fact]
    public void Analyze_returns_empty_when_both_graph_and_inventory_have_no_gcp_resource_ids()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Properties = new()
                }
            ]
        };

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze("[]", graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void Analyze_reports_graph_only_when_resources_json_is_missing()
    {
        GraphSnapshot graph = CreateGraphWithResourceId(GraphResourceId);

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(null, graph);

        result.HasMismatches.Should().BeTrue();
        result.GraphOnlyResourceIds.Should().ContainSingle().Which.Should().Be(GraphResourceId.ToLowerInvariant());
        result.InventoryOnlyResourceIds.Should().BeEmpty();
    }

    [Fact]
    public void Analyze_reports_graph_only_and_inventory_only_resource_ids()
    {
        GraphSnapshot graph = CreateGraphWithResourceId(GraphResourceId);

        string resourcesJson =
            $$"""
              [
                {
                  "name": "{{InventoryResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.GraphOnlyResourceIds.Should().ContainSingle().Which.Should().Be(GraphResourceId.ToLowerInvariant());
        result.InventoryOnlyResourceIds.Should().ContainSingle().Which.Should().Be(InventoryResourceId.ToLowerInvariant());
    }

    private static GraphSnapshot CreateGraphWithResourceId(string resourceId)
    {
        return new GraphSnapshot
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vm",
                    Properties = new Dictionary<string, string>
                    {
                        ["gcpResourceId"] = resourceId
                    }
                }
            ]
        };
    }
}
