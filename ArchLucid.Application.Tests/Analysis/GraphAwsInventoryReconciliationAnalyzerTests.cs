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
    public void CompareQuality_Analyze_matches_inventory_when_topology_property_bag_uses_pascal_case_aws_resource_id_key()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "ec2",
                    Properties = new Dictionary<string, string>
                    {
                        ["AwsResourceId"] = GraphArn
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "name": "{{GraphArn}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_uses_identifier_property_for_arn()
    {
        const string arn =
            "arn:aws:config:us-east-1:123456789012:config-resource/cfg-identifier-key";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-aws-config",
                    Label = "aws_config_configuration_recorder.rec",
                    Properties = new Dictionary<string, string> { ["identifier"] = arn }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "arn": "{{arn}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_uses_id_property_for_arn()
    {
        const string arn =
            "arn:aws:ec2:us-east-1:123456789012:instance/i-topology-id-key";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-tf-show-json-1",
                    Label = "aws_instance.app",
                    Properties = new Dictionary<string, string> { ["id"] = arn }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "arn": "{{arn}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_uses_tf_arn_property()
    {
        const string arn =
            "arn:aws:ec2:us-east-1:123456789012:instance/i-tf-topology";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-tf-show-json-1",
                    Label = "aws_instance.app",
                    Properties = new Dictionary<string, string> { ["tf.arn"] = arn }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "name": "{{arn}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_graph_and_inventory_when_arn_casing_differs()
    {
        const string canonicalArn =
            "arn:aws:ec2:us-east-1:123456789012:instance/i-shared";
        const string upperInventoryArn =
            "ARN:AWS:EC2:US-EAST-1:123456789012:INSTANCE/I-SHARED";

        GraphSnapshot graph = CreateGraphWithArn(canonicalArn);

        string resourcesJson =
            $$"""
              [
                {
                  "name": "{{upperInventoryArn}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_supplies_arn_property_instead_of_name()
    {
        const string sharedArn =
            "arn:aws:ec2:us-east-1:123456789012:instance/i-shared";

        GraphSnapshot graph = CreateGraphWithArn(sharedArn);

        string resourcesJson =
            $$"""
              [
                {
                  "arn": "{{sharedArn}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_json_root_wraps_data_array()
    {
        const string arn =
            "arn:aws:ec2:us-east-1:123456789012:instance/i-data-array";

        GraphSnapshot graph = CreateGraphWithArn(arn);

        string resourcesJson =
            $$"""
              {
                "data": [
                  {
                    "arn": "{{arn}}"
                  }
                ]
              }
              """;

        InventoryReconciliationResult result =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_data_rows_wrap_arn_in_json_api_attributes()
    {
        const string arn =
            "arn:aws:ec2:us-east-1:123456789012:instance/i-json-api-attributes";

        GraphSnapshot graph = CreateGraphWithArn(arn);

        string resourcesJson =
            $$"""
              {
                "data": [
                  {
                    "type": "aws:ec2:instance",
                    "attributes": {
                      "arn": "{{arn}}"
                    }
                  }
                ]
              }
              """;

        InventoryReconciliationResult result =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_json_root_lists_resources_in_included_sidecar()
    {
        const string arn =
            "arn:aws:ec2:us-east-1:123456789012:instance/i-included-sidecar";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-json-api",
                    Label = "aws_instance.app",
                    Properties = new Dictionary<string, string> { ["arn"] = arn }
                }
            ]
        };

        string resourcesJson =
            $$"""
              {
                "data": [],
                "included": [
                  {
                    "arn": "{{arn}}"
                  }
                ]
              }
              """;

        InventoryReconciliationResult result =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_json_root_lists_primary_resources_and_included_sidecar()
    {
        const string primaryArn =
            "arn:aws:s3:::primary-bucket";

        const string sidecarArn =
            "arn:aws:ec2:us-east-1:123456789012:instance/i-sidecar";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-primary",
                    Label = "aws_s3_bucket.primary",
                    Properties = new Dictionary<string, string> { ["arn"] = primaryArn }
                },
                new GraphNode
                {
                    NodeId = "t2",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-sidecar",
                    Label = "aws_instance.sidecar",
                    Properties = new Dictionary<string, string> { ["arn"] = sidecarArn }
                }
            ]
        };

        string resourcesJson =
            $$"""
              {
                "resources": [
                  {
                    "arn": "{{primaryArn}}"
                  }
                ],
                "included": [
                  {
                    "arn": "{{sidecarArn}}"
                  }
                ]
              }
              """;

        InventoryReconciliationResult result =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_ignores_inventory_row_when_resourceId_is_uuid_not_arn()
    {
        const string arn =
            "arn:aws:ec2:us-east-1:123456789012:instance/i-graph-only";

        GraphSnapshot graph = CreateGraphWithArn(arn);

        string resourcesJson =
            """
              [
                {
                  "resourceId": "550e8400-e29b-41d4-a716-446655440000"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeTrue();
        result.GraphOnlyResourceIds.Should().ContainSingle().Which.Should().Be(arn.ToLowerInvariant());
        result.InventoryOnlyResourceIds.Should().BeEmpty();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_supplies_identifier_property()
    {
        const string arn =
            "arn:aws:iam::123456789012:role/config-ident";

        GraphSnapshot graph = CreateGraphWithArn(arn);

        string resourcesJson =
            $$"""
              [
                {
                  "identifier": "{{arn}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_supplies_id_property_instead_of_name()
    {
        const string arn =
            "arn:aws:lambda:us-east-1:123456789012:function:my-func";

        GraphSnapshot graph = CreateGraphWithArn(arn);

        string resourcesJson =
            $$"""
              [
                {
                  "id": "{{arn}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_json_root_wraps_Resources_array_pascal_case()
    {
        const string arn =
            "arn:aws:sqs:us-east-1:123456789012:queue/wrap-pascal";

        GraphSnapshot graph = CreateGraphWithArn(arn);

        string resourcesJson =
            $$"""
            {
              "Resources": [
                {
                  "arn": "{{arn}}"
                }
              ]
            }
            """;

        InventoryReconciliationResult result =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_json_root_wraps_resources_array()
    {
        const string arn =
            "arn:aws:ec2:us-east-1:123456789012:instance/i-wrap-root";

        GraphSnapshot graph = CreateGraphWithArn(arn);

        string resourcesJson =
            $$"""
            {
              "resources": [
                {
                  "arn": "{{arn}}"
                }
              ]
            }
            """;

        InventoryReconciliationResult result =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_supplies_resourceName_property()
    {
        const string arn =
            "arn:aws:s3:::bucket-resource-name-key";

        GraphSnapshot graph = CreateGraphWithArn(arn);

        string resourcesJson =
            $$"""
              [
                {
                  "resourceName": "{{arn}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_supplies_tf_arn_property()
    {
        const string sharedArn =
            "arn:aws:ec2:us-east-1:123456789012:instance/i-tf-arn-row";

        GraphSnapshot graph = CreateGraphWithArn(sharedArn);

        string resourcesJson =
            $$"""
              [
                {
                  "tf.arn": "{{sharedArn}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_uses_pascal_case_Arn_property()
    {
        const string sharedArn =
            "arn:aws:s3:::bucket-pascal-arn-key";

        GraphSnapshot graph = CreateGraphWithArn(sharedArn);

        string resourcesJson =
            $$"""
              [
                {
                  "Arn": "{{sharedArn}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAwsInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
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
