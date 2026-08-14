using ArchLucid.Application.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class GraphAwsInventoryReconciliationAnalyzerTests
{
    private const string GraphArn =
        "arn:aws:ec2:us-east-1:123456789012:instance/i-graph";

    private const string InventoryArn =
        "arn:aws:s3:::live-bucket";

    [Fact]
    public void Analyze_returns_empty_when_both_graph_and_inventory_have_no_aws_resource_ids()
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
            GraphAwsInventoryReconciliationAnalyzer.Analyze("[]", graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void Analyze_reports_inventory_only_when_graph_has_no_aws_resource_ids()
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

        string resourcesJson =
            $$"""
              [
                {
                  "name": "{{InventoryArn}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeTrue();
        result.GraphOnlyResourceIds.Should().BeEmpty();
        result.InventoryOnlyResourceIds.Should().ContainSingle().Which.Should().Be(InventoryArn.ToLowerInvariant());
    }

    [Fact]
    public void Analyze_reports_graph_only_when_resources_json_is_missing()
    {
        GraphSnapshot graph = CreateGraphWithArn(GraphArn);

        InventoryReconciliationResult result =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(null, graph);

        result.HasMismatches.Should().BeTrue();
        result.GraphOnlyResourceIds.Should().ContainSingle().Which.Should().Be(GraphArn.ToLowerInvariant());
        result.InventoryOnlyResourceIds.Should().BeEmpty();
    }

    [Fact]
    public void Analyze_reports_graph_only_and_inventory_only_resource_ids()
    {
        GraphSnapshot graph = CreateGraphWithArn(GraphArn);

        string resourcesJson =
            $$"""
              [
                {
                  "name": "{{InventoryArn}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.GraphOnlyResourceIds.Should().ContainSingle().Which.Should().Be(GraphArn.ToLowerInvariant());
        result.InventoryOnlyResourceIds.Should().ContainSingle().Which.Should().Be(InventoryArn.ToLowerInvariant());
    }

    private static GraphSnapshot CreateGraphWithArn(string arn)
    {
        return new GraphSnapshot
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "instance",
                    Properties = new Dictionary<string, string>
                    {
                        ["arn"] = arn
                    }
                }
            ]
        };
    }
}
