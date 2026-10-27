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
    public void CompareQuality_Analyze_matches_inventory_when_inventory_uses_cloud_run_asset_name()
    {
        const string projectsPath =
            "projects/demo-project/locations/us-central1/services/api";

        const string cloudAssetName =
            "//run.googleapis.com/projects/demo-project/locations/us-central1/services/api";

        GraphSnapshot graph = CreateGraphWithResourceId(projectsPath);

        string resourcesJson =
            $$"""
              [
                {
                  "name": "{{cloudAssetName}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void Analyze_treats_cloud_asset_full_name_as_same_resource_as_projects_path()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/graph-vm";

        const string cloudAssetName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a/instances/graph-vm";

        GraphSnapshot graph = CreateGraphWithResourceId(projectsPath);

        string resourcesJson =
            $$"""
              [
                {
                  "name": "{{cloudAssetName}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
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

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_uses_selfLink_property()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/graph-vm";

        const string selfLink =
            "https://www.googleapis.com/compute/v1/projects/demo-project/zones/us-central1-a/instances/graph-vm";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-gcp-api",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string> { ["selfLink"] = selfLink }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "name": "{{projectsPath}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_json_root_wraps_data_items_array()
    {
        GraphSnapshot graph = CreateGraphWithResourceId(GraphResourceId);

        string resourcesJson =
            $$"""
            {
              "data": {
                "items": [
                  {
                    "name": "{{GraphResourceId}}"
                  }
                ]
              }
            }
            """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_uses_tf_resource_id_property()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-tf-show-json-gcp",
                    Label = "google_compute_instance.app",
                    Properties = new Dictionary<string, string> { ["tf.resource_id"] = GraphResourceId }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "name": "{{GraphResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void Analyze_matches_inventory_when_topology_property_bag_uses_pascal_case_gcp_resource_id_key()
    {
        GraphSnapshot graph = new()
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
                        ["GcpResourceId"] = GraphResourceId
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "name": "{{GraphResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_supplies_selfLink_property()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/graph-vm";

        const string selfLink =
            "https://www.googleapis.com/compute/v1/projects/demo-project/zones/us-central1-a/instances/graph-vm";

        GraphSnapshot graph = CreateGraphWithResourceId(projectsPath);

        string resourcesJson =
            $$"""
              [
                {
                  "selfLink": "{{selfLink}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_json_root_wraps_data_value_array()
    {
        const string projectsPath =
            "projects/demo-project/locations/global/keyRings/ring/cryptoKeys/key1";

        GraphSnapshot graph = CreateGraphWithResourceId(projectsPath);

        string resourcesJson =
            $$"""
            {
              "data": {
                "value": [
                  {
                    "name": "{{projectsPath}}"
                  }
                ]
              }
            }
            """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_supplies_id_property_with_projects_path()
    {
        const string projectsPath =
            "projects/demo-project/locations/us-central1/services/api";

        GraphSnapshot graph = CreateGraphWithResourceId(projectsPath);

        string resourcesJson =
            $$"""
              [
                {
                  "id": "{{projectsPath}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_inventory_uses_https_secret_manager_self_link()
    {
        const string projectsPath =
            "projects/demo-project/secrets/api-key";

        const string selfLink =
            "https://secretmanager.googleapis.com/v1/projects/demo-project/secrets/api-key";

        GraphSnapshot graph = CreateGraphWithResourceId(projectsPath);

        string resourcesJson =
            $$"""
              [
                {
                  "selfLink": "{{selfLink}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_json_root_wraps_data_resources_array()
    {
        GraphSnapshot graph = CreateGraphWithResourceId(GraphResourceId);

        string resourcesJson =
            $$"""
            {
              "data": {
                "resources": [
                  {
                    "name": "{{GraphResourceId}}"
                  }
                ]
              }
            }
            """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_json_root_wraps_resources_array()
    {
        GraphSnapshot graph = CreateGraphWithResourceId(GraphResourceId);

        string resourcesJson =
            $$"""
            {
              "resources": [
                {
                  "name": "{{GraphResourceId}}"
                }
              ]
            }
            """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_supplies_resourceName_property()
    {
        GraphSnapshot graph = CreateGraphWithResourceId(GraphResourceId);

        string resourcesJson =
            $$"""
              [
                {
                  "resourceName": "{{GraphResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_supplies_gcpResourceId_property_instead_of_name()
    {
        GraphSnapshot graph = CreateGraphWithResourceId(GraphResourceId);

        string resourcesJson =
            $$"""
              [
                {
                  "gcpResourceId": "{{GraphResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_supplies_resourceId_property_instead_of_name()
    {
        GraphSnapshot graph = CreateGraphWithResourceId(GraphResourceId);

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{GraphResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_supplies_tf_resource_id_property()
    {
        GraphSnapshot graph = CreateGraphWithResourceId(GraphResourceId);

        string resourcesJson =
            $$"""
              [
                {
                  "tf.resource_id": "{{GraphResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_uses_pascal_case_GcpResourceId_property()
    {
        GraphSnapshot graph = CreateGraphWithResourceId(GraphResourceId);

        string resourcesJson =
            $$"""
              [
                {
                  "GcpResourceId": "{{GraphResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void Analyze_reports_graph_only_when_inventory_row_has_unrelated_gcpResourceId_without_name()
    {
        GraphSnapshot graph = CreateGraphWithResourceId(GraphResourceId);

        string resourcesJson =
            """
            [
              {
                "gcpResourceId": "projects/demo-project/global/networks/live-vpc"
              }
            ]
            """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.GraphOnlyResourceIds.Should().ContainSingle().Which.Should().Be(GraphResourceId.ToLowerInvariant());
        result.InventoryOnlyResourceIds.Should().ContainSingle();
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
