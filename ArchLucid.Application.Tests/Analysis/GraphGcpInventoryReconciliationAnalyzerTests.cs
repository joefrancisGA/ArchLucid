using System.Text.Json;

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
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_combines_scalar_ancestors_parent_with_short_name()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/scalar-topology-ancestor-vm";

        const string ancestorParent =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-scalar-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["ancestors"] = ancestorParent,
                        ["name"] = "instances/scalar-topology-ancestor-vm",
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_combines_ancestors_json_array_with_short_name()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/graph-vm";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["ancestors"] = ancestorsJson,
                        ["name"] = "instances/graph-vm",
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_short_name_with_ancestors_in_serialized_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/graph-vm-split-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-ancestors-json",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["name"] = "instances/graph-vm-split-ancestors",
                        ["properties"] =
                            "{\"ancestors\":" + ancestorsJson + "}",
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_short_name_with_parent_in_serialized_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/graph-vm-split-parent";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-json",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["name"] = "instances/graph-vm-split-parent",
                        ["properties"] =
                            "{\"parent\":\"" + parentFullName + "\"}",
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_serializes_configuration_json_array_string_with_nested_attributes_cai_path()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/config-array-nested-cai";

        string configurationJson =
            "[{\"attributes\":{\"name\":\"" + projectsPath + "\"}}]";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-config-array-nested",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] = configurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_serializes_supplementary_configuration_json_array_string_with_nested_attributes_cai_path()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/supp-config-array-nested-cai";

        string supplementaryConfigurationJson =
            "[{\"attributes\":{\"name\":\"" + projectsPath + "\"}}]";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-supp-config-array-nested",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] = supplementaryConfigurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_resourceName_with_parent_in_serialized_attributes_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-attributes-bag";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-attributes",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["resourceName"] = "instances/split-parent-attributes-bag",
                        ["attributes"] =
                            "{\"parent\":\"" + parentFullName + "\"}",
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_serializes_related_events_json_array_string_with_nested_attributes_cai_path()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/related-events-array-nested-cai";

        string relatedEventsJson =
            "[{\"attributes\":{\"name\":\"" + projectsPath + "\"}}]";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-related-events-array-nested",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["relatedEvents"] = relatedEventsJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_short_name_with_ancestors_in_serialized_attributes_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-ancestors-attributes-bag";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-ancestors-attributes",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["name"] = "instances/split-ancestors-attributes-bag",
                        ["attributes"] =
                            "{\"ancestors\":" + ancestorsJson + "}",
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_serializes_related_events_wrapper_json_with_nested_attributes_cai_path()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/related-events-wrapper-nested-cai";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"name\":\"" + projectsPath + "\"}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-related-events-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_serialized_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-parent-configuration-bag";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-parent-configuration",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-parent-configuration-bag",
                        ["configuration"] =
                            "{\"parent\":\"" + parentFullName + "\"}",
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_serialized_supplementary_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-ancestors-supp-config";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-ancestors-supp-config",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-ancestors-supp-config",
                        ["supplementaryConfiguration"] =
                            "{\"ancestors\":" + ancestorsJson + "}",
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_serialized_attributes_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-parent-attributes-bag";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-parent-attributes",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-parent-attributes-bag",
                        ["attributes"] =
                            "{\"parent\":\"" + parentFullName + "\"}",
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_serialized_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-ancestors-properties-bag";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-ancestors-properties",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-ancestors-properties-bag",
                        ["properties"] =
                            "{\"ancestors\":" + ancestorsJson + "}",
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_serialized_related_events_array_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-parent-related-events-array";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        const string relatedEventsArrayJson =
            "[{\"parent\":\"" + parentFullName + "\"}]";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-parent-related-events-array",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-parent-related-events-array",
                        ["relatedEvents"] = relatedEventsArrayJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_configuration_supplementary_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-nested-config-supp-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string configurationJson =
            "{\"supplementaryConfiguration\":{\"ancestors\":" + ancestorsJson + "}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-nested-config-supp-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-nested-config-supp-ancestors",
                        ["configuration"] = configurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_nested_properties_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-nested-props-config-parent";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        const string propertiesJson =
            "{\"configuration\":{\"parent\":\"" + parentFullName + "\"}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-nested-props-config-parent",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-nested-props-config-parent",
                        ["properties"] = propertiesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_attributes_supplementary_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-nested-attrs-supp-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string attributesJson =
            "{\"supplementaryConfiguration\":{\"ancestors\":" + ancestorsJson + "}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-nested-attrs-supp-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-nested-attrs-supp-ancestors",
                        ["attributes"] = attributesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_nested_attributes_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-nested-attrs-config-parent";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        const string attributesJson =
            "{\"configuration\":{\"parent\":\"" + parentFullName + "\"}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-nested-attrs-config-parent",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-nested-attrs-config-parent",
                        ["attributes"] = attributesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_properties_supplementary_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-nested-props-supp-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string propertiesJson =
            "{\"supplementaryConfiguration\":{\"ancestors\":" + ancestorsJson + "}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-nested-props-supp-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-nested-props-supp-ancestors",
                        ["properties"] = propertiesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_nested_configuration_supplementary_configuration_under_attributes_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-deep-attrs-config-supp-parent";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        const string attributesJson =
            "{\"configuration\":{\"supplementaryConfiguration\":{\"parent\":\""
            + parentFullName
            + "\"}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-deep-attrs-config-supp-parent",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-deep-attrs-config-supp-parent",
                        ["attributes"] = attributesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_attributes_configuration_under_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-deep-props-attrs-config-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string propertiesJson =
            "{\"attributes\":{\"configuration\":{\"ancestors\":" + ancestorsJson + "}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-deep-props-attrs-config-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-deep-props-attrs-config-ancestors",
                        ["properties"] = propertiesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-config-wrapper";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"parent\":\"" + parentFullName + "\"}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-name-related-events-config-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-config-wrapper",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_attributes_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-attrs-wrapper";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"parent\":\"" + parentFullName + "\"}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-name-related-events-attrs-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-attrs-wrapper",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_supplementary_configuration_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-supp-wrapper";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"supplementaryConfiguration\":{\"parent\":\"" + parentFullName + "\"}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-name-related-events-supp-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-supp-wrapper",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_attributes_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-config-attrs-wrapper";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"attributes\":{\"parent\":\"" + parentFullName + "\"}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-name-related-events-config-attrs-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-config-attrs-wrapper",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_configuration_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-props-config-wrapper";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"configuration\":{\"parent\":\"" + parentFullName + "\"}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-name-related-events-props-config-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-props-config-wrapper",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_supplementary_configuration_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-supp-props-wrapper";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"supplementaryConfiguration\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-name-related-events-supp-props-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-supp-props-wrapper",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_supplementary_configuration_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-config-supp-props-wrapper";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-name-related-events-config-supp-props-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-config-supp-props-wrapper",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_attributes_configuration_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-props-attrs-config-wrapper";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"attributes\":{\"configuration\":{\"parent\":\"" + parentFullName + "\"}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-name-related-events-props-attrs-config-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-props-attrs-config-wrapper",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_properties_attributes_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-config-props-attrs-wrapper";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"properties\":{\"attributes\":{\"parent\":\"" + parentFullName + "\"}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-name-related-events-config-props-attrs-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-config-props-attrs-wrapper",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_attributes_supplementary_configuration_properties_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-attrs-supp-props-config-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string attributesJson =
            "{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-attrs-supp-props-config-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-attrs-supp-props-config-ancestors",
                        ["attributes"] = attributesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_supplementary_configuration_configuration_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-supp-config-config-props-wrapper";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"supplementaryConfiguration\":{\"configuration\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-name-related-events-supp-config-config-props-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-supp-config-config-props-wrapper",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_configuration_attributes_supplementary_configuration_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-config-attrs-supp-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string configurationJson =
            "{\"attributes\":{\"supplementaryConfiguration\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-config-attrs-supp-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-config-attrs-supp-props-ancestors",
                        ["configuration"] = configurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_supplementary_configuration_configuration_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-props-supp-config-wrapper";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"supplementaryConfiguration\":{\"configuration\":{\"parent\":\"" + parentFullName + "\"}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-name-related-events-props-supp-config-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-props-supp-config-wrapper",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_supplementary_configuration_configuration_attributes_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-supp-config-attrs-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string supplementaryConfigurationJson =
            "{\"configuration\":{\"attributes\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-supp-config-attrs-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-supp-config-attrs-props-ancestors",
                        ["supplementaryConfiguration"] = supplementaryConfigurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_attributes_properties_supplementary_configuration_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-attrs-props-supp-wrapper";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"properties\":{\"supplementaryConfiguration\":{\"parent\":\"" + parentFullName + "\"}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-name-related-events-attrs-props-supp-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-attrs-props-supp-wrapper",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_properties_supplementary_configuration_configuration_attributes_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-props-supp-config-attrs-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string propertiesJson =
            "{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-props-supp-config-attrs-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-props-supp-config-attrs-ancestors",
                        ["properties"] = propertiesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-config-attrs-props-wrapper";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-name-related-events-config-attrs-props-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-config-attrs-props-wrapper",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_attributes_configuration_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-attrs-config-props-wrapper";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"configuration\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-name-related-events-attrs-config-props-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-attrs-config-props-wrapper",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_supplementary_configuration_attributes_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-config-supp-attrs-wrapper";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"supplementaryConfiguration\":{\"attributes\":{\"parent\":\"" + parentFullName + "\"}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-name-related-events-config-supp-attrs-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-config-supp-attrs-wrapper",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_supplementary_configuration_attributes_configuration_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-supp-attrs-config-wrapper";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"supplementaryConfiguration\":{\"attributes\":{\"configuration\":{\"parent\":\"" + parentFullName + "\"}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-name-related-events-supp-attrs-config-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-supp-attrs-config-wrapper",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_attributes_supplementary_configuration_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-attrs-supp-props-wrapper";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"supplementaryConfiguration\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-name-related-events-attrs-supp-props-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-attrs-supp-props-wrapper",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_properties_supplementary_configuration_attributes_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-props-supp-attrs-config-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string propertiesJson =
            "{\"supplementaryConfiguration\":{\"attributes\":{\"configuration\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-props-supp-attrs-config-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-props-supp-attrs-config-ancestors",
                        ["properties"] = propertiesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_supplementary_configuration_properties_configuration_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-supp-props-config-wrapper";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"parent\":\"" + parentFullName + "\"}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-name-related-events-supp-props-config-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-supp-props-config-wrapper",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_configuration_properties_attributes_supplementary_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-config-props-attrs-supp-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string configurationJson =
            "{\"properties\":{\"attributes\":{\"supplementaryConfiguration\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-config-props-attrs-supp-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-config-props-attrs-supp-ancestors",
                        ["configuration"] = configurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_attributes_properties_configuration_supplementary_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-attrs-props-config-supp-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string attributesJson =
            "{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-attrs-props-config-supp-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-attrs-props-config-supp-ancestors",
                        ["attributes"] = attributesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_supplementary_configuration_properties_configuration_attributes_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-supp-props-config-attrs-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string supplementaryConfigurationJson =
            "{\"properties\":{\"configuration\":{\"attributes\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-supp-props-config-attrs-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-supp-props-config-attrs-ancestors",
                        ["supplementaryConfiguration"] = supplementaryConfigurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_properties_configuration_attributes_supplementary_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-props-config-attrs-supp-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string propertiesJson =
            "{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-props-config-attrs-supp-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-props-config-attrs-supp-ancestors",
                        ["properties"] = propertiesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_configuration_attributes_properties_supplementary_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-config-attrs-props-supp-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string configurationJson =
            "{\"attributes\":{\"properties\":{\"supplementaryConfiguration\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-config-attrs-props-supp-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-config-attrs-props-supp-ancestors",
                        ["configuration"] = configurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-props-wrapper";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"parent\":\"" + parentFullName + "\"}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-name-related-events-props-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-props-wrapper",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_properties_supplementary_configuration_configuration_under_attributes_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-attrs-props-supp-config-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string attributesJson =
            "{\"properties\":{\"supplementaryConfiguration\":{\"configuration\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-attrs-props-supp-config-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-attrs-props-supp-config-ancestors",
                        ["attributes"] = attributesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_supplementary_configuration_under_attributes_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-attrs-supp-config-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string attributesJson =
            "{\"supplementaryConfiguration\":{\"configuration\":{\"ancestors\":" + ancestorsJson + "}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-attrs-supp-config-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-attrs-supp-config-ancestors",
                        ["attributes"] = attributesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_attributes_configuration_supplementary_configuration_under_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-props-attrs-config-supp-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string propertiesJson =
            "{\"attributes\":{\"configuration\":{\"supplementaryConfiguration\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-props-attrs-config-supp-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-props-attrs-config-supp-ancestors",
                        ["properties"] = propertiesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_configuration_supplementary_configuration_under_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-props-config-supp-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string propertiesJson =
            "{\"configuration\":{\"supplementaryConfiguration\":{\"ancestors\":" + ancestorsJson + "}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-props-config-supp-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-props-config-supp-ancestors",
                        ["properties"] = propertiesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_configuration_under_properties_supplementary_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-props-supp-config-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string propertiesJson =
            "{\"supplementaryConfiguration\":{\"configuration\":{\"ancestors\":" + ancestorsJson + "}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-props-supp-config-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-props-supp-config-ancestors",
                        ["properties"] = propertiesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_resourceName_with_parent_in_serialized_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-configuration-bag";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-configuration",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["resourceName"] = "instances/split-parent-configuration-bag",
                        ["configuration"] =
                            "{\"parent\":\"" + parentFullName + "\"}",
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_serializes_configuration_json_with_related_events_wrapper_and_nested_attributes_cai_path()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/config-related-events-wrapper-cai";

        string configurationJson =
            "{\"relatedEvents\":[{\"attributes\":{\"name\":\"" + projectsPath + "\"}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-config-related-events-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] = configurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_short_name_with_ancestors_in_serialized_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-ancestors-configuration-bag";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-ancestors-configuration",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["name"] = "instances/split-ancestors-configuration-bag",
                        ["configuration"] =
                            "{\"ancestors\":" + ancestorsJson + "}",
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_serializes_supplementary_configuration_json_with_related_events_wrapper_and_nested_attributes_cai_path()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/supp-config-related-events-wrapper-cai";

        string supplementaryConfigurationJson =
            "{\"relatedEvents\":[{\"attributes\":{\"name\":\"" + projectsPath + "\"}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-supp-config-related-events-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] = supplementaryConfigurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_wrapper_nested_attributes_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-related-events-attrs";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"parent\":\"" + parentFullName + "\"}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-related-events-attrs",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-related-events-attrs",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_wrapper_serialized_configuration_string_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-related-events-serialized-config";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string configurationInnerJson = "{\"parent\":\"" + parentFullName + "\"}";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":" + JsonSerializer.Serialize(configurationInnerJson) + "}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-serialized-config",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-related-events-serialized-config",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_short_name_with_parent_in_serialized_supplementary_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-supp-config-bag";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-supp-config",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["name"] = "instances/split-parent-supp-config-bag",
                        ["supplementaryConfiguration"] =
                            "{\"parent\":\"" + parentFullName + "\"}",
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_serialized_related_events_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-wrapper";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"parent\":\"" + parentFullName + "\"}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-name-related-events-wrapper",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-wrapper",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_serialized_related_events_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-display-name-related-events",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events",
                        ["relatedEvents"] =
                            "{\"parent\":\"" + parentFullName + "\"}",
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_resourceName_with_ancestors_in_serialized_related_events_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-ancestors-resource-name-related-events";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-ancestors-resource-name-related-events",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["resourceName"] = "instances/split-ancestors-resource-name-related-events",
                        ["relatedEvents"] =
                            "{\"ancestors\":" + ancestorsJson + "}",
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_short_name_with_parent_in_serialized_related_events_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-related-events-bag";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["name"] = "instances/split-parent-related-events-bag",
                        ["relatedEvents"] =
                            "{\"parent\":\"" + parentFullName + "\"}",
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_short_name_with_ancestors_in_serialized_related_events_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-ancestors-related-events-bag";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-ancestors-related-events",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["name"] = "instances/split-ancestors-related-events-bag",
                        ["relatedEvents"] =
                            "{\"ancestors\":" + ancestorsJson + "}",
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_short_name_with_ancestors_in_serialized_supplementary_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-ancestors-supp-config-bag";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-ancestors-supp-config",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["name"] = "instances/split-ancestors-supp-config-bag",
                        ["supplementaryConfiguration"] =
                            "{\"ancestors\":" + ancestorsJson + "}",
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_combines_parent_and_short_name()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/graph-vm";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-parent",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["parent"] = parentFullName,
                        ["name"] = "instances/graph-vm",
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_uses_fullResourceName_cai_path()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/graph-vm";

        const string fullResourceName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a/instances/graph-vm";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string> { ["fullResourceName"] = fullResourceName }
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
    public void CompareQuality_Analyze_ignores_inventory_row_when_id_is_bare_numeric_without_projects_path()
    {
        GraphSnapshot graph = CreateGraphWithResourceId(GraphResourceId);

        string resourcesJson =
            """
              [
                {
                  "id": "12345678901234567890"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeTrue();
        result.GraphOnlyResourceIds.Should().ContainSingle().Which.Should().Be(GraphResourceId);
        result.InventoryOnlyResourceIds.Should().BeEmpty();
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
    public void CompareQuality_Analyze_matches_inventory_when_row_combines_ancestors_json_literal_string_with_short_name()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/json-literal-ancestor-vm";

        const string ancestorParent =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        GraphSnapshot graph = CreateGraphWithResourceId(projectsPath);

        string resourcesJson =
            $$"""
              [
                {
                  "ancestors": "[\"{{ancestorParent}}\"]",
                  "name": "instances/json-literal-ancestor-vm"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_combines_ancestors_string_parent_with_short_name()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/scalar-ancestor-vm";

        const string ancestorParent =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        GraphSnapshot graph = CreateGraphWithResourceId(projectsPath);

        string resourcesJson =
            $$"""
              [
                {
                  "ancestors": "{{ancestorParent}}",
                  "name": "instances/scalar-ancestor-vm"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_combines_ancestors_array_with_short_name()
    {
        const string projectsPath =
            "projects/demo-project/locations/us-central1-a/zones/us-central1-a/instances/ancestor-vm";

        const string ancestorParent =
            "//compute.googleapis.com/projects/demo-project/locations/us-central1-a/zones/us-central1-a";

        GraphSnapshot graph = CreateGraphWithResourceId(projectsPath);

        string resourcesJson =
            $$"""
              [
                {
                  "ancestors": [
                    "{{ancestorParent}}"
                  ],
                  "name": "instances/ancestor-vm"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_combines_parent_full_name_with_short_name()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/parent-child-vm";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        GraphSnapshot graph = CreateGraphWithResourceId(projectsPath);

        string resourcesJson =
            $$"""
              [
                {
                  "parent": "{{parentFullName}}",
                  "name": "instances/parent-child-vm"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_supplies_fullResourceName_cai_asset_path()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/cai-vm";

        const string fullResourceName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a/instances/cai-vm";

        GraphSnapshot graph = CreateGraphWithResourceId(projectsPath);

        string resourcesJson =
            $$"""
              [
                {
                  "fullResourceName": "{{fullResourceName}}"
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
    public void CompareQuality_Analyze_matches_inventory_when_row_has_full_name_path_and_whitespace_only_resourceName()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/whitespace-resource-name-vm";

        GraphSnapshot graph = CreateGraphWithResourceId(projectsPath);

        string resourcesJson =
            $$"""
              [
                {
                  "name": "{{projectsPath}}",
                  "resourceName": "   "
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_has_full_name_path_and_empty_resourceName()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/empty-resource-name-vm";

        GraphSnapshot graph = CreateGraphWithResourceId(projectsPath);

        string resourcesJson =
            $$"""
              [
                {
                  "name": "{{projectsPath}}",
                  "resourceName": ""
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_has_display_name_label_and_whitespace_resourceName_with_name_path()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/display-name-whitespace-resource";

        GraphSnapshot graph = CreateGraphWithResourceId(projectsPath);

        string resourcesJson =
            $$"""
              [
                {
                  "name": "{{projectsPath}}",
                  "displayName": "display-name-label",
                  "resourceName": "   "
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_has_ui_name_and_displayName_path()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/cai-display-name-field-vm";

        GraphSnapshot graph = CreateGraphWithResourceId(projectsPath);

        string resourcesJson =
            $$"""
              [
                {
                  "name": "cai-ui-label",
                  "displayName": "{{projectsPath}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphGcpInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_has_display_name_and_resourceName_path()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/cai-display-name-vm";

        GraphSnapshot graph = CreateGraphWithResourceId(projectsPath);

        string resourcesJson =
            $$"""
              [
                {
                  "name": "cai-display-label",
                  "resourceName": "{{projectsPath}}"
                }
              ]
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_serialized_related_events_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-ancestors-display-name-related-events";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-ancestors-display-name-related-events",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-ancestors-display-name-related-events",
                        ["relatedEvents"] =
                            "{\"ancestors\":" + ancestorsJson + "}",
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_properties_supplementary_configuration_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-config-props-supp";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"properties\":{\"supplementaryConfiguration\":{\"parent\":\"" + parentFullName + "\"}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-config-props-supp",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-config-props-supp",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_supplementary_configuration_configuration_attributes_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-supp-config-config-attrs";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"parent\":\"" + parentFullName + "\"}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-supp-config-config-attrs",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-supp-config-config-attrs",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_properties_configuration_supplementary_configuration_attributes_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-props-config-supp-attrs-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string propertiesJson =
            "{\"configuration\":{\"supplementaryConfiguration\":{\"attributes\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-props-config-supp-attrs-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-props-config-supp-attrs-ancestors",
                        ["properties"] = propertiesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_attributes_supplementary_configuration_configuration_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-attrs-supp-config-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-attrs-supp-config-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-attrs-supp-config-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_attributes_supplementary_configuration_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-config-attrs-supp-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-config-attrs-supp-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-config-attrs-supp-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_attributes_properties_supplementary_configuration_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-attrs-props-supp-config-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string attributesJson =
            "{\"properties\":{\"supplementaryConfiguration\":{\"configuration\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-attrs-props-supp-config-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-attrs-props-supp-config-ancestors",
                        ["attributes"] = attributesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_supplementary_configuration_properties_attributes_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-supp-props-attrs-config-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string supplementaryConfigurationJson =
            "{\"properties\":{\"attributes\":{\"configuration\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-supp-props-attrs-config-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-supp-props-attrs-config-ancestors",
                        ["supplementaryConfiguration"] = supplementaryConfigurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_configuration_attributes_supplementary_configuration_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-props-config-attrs-supp";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-props-config-attrs-supp",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-props-config-attrs-supp",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_supplementary_configuration_properties_configuration_attributes_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-supp-props-config-attrs";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"attributes\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-supp-props-config-attrs",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-supp-props-config-attrs",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_supplementary_configuration_properties_attributes_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-config-supp-props-attrs";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"attributes\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-config-supp-props-attrs",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-config-supp-props-attrs",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_attributes_properties_supplementary_configuration_configuration_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-attrs-props-supp-config";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"properties\":{\"supplementaryConfiguration\":{\"configuration\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-attrs-props-supp-config",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-attrs-props-supp-config",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_configuration_supplementary_configuration_properties_attributes_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-config-supp-props-attrs-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string configurationJson =
            "{\"supplementaryConfiguration\":{\"properties\":{\"attributes\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-config-supp-props-attrs-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-config-supp-props-attrs-ancestors",
                        ["configuration"] = configurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_supplementary_configuration_configuration_attributes_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-props-supp-config-attrs";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-props-supp-config-attrs",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-props-supp-config-attrs",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_supplementary_configuration_configuration_properties_attributes_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-supp-config-props-attrs";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"supplementaryConfiguration\":{\"configuration\":{\"properties\":{\"attributes\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-supp-config-props-attrs",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-supp-config-props-attrs",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_attributes_configuration_supplementary_configuration_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-attrs-config-supp-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-attrs-config-supp-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-attrs-config-supp-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_configuration_properties_supplementary_configuration_attributes_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-config-props-supp-attrs-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string configurationJson =
            "{\"properties\":{\"supplementaryConfiguration\":{\"attributes\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-config-props-supp-attrs-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-config-props-supp-attrs-ancestors",
                        ["configuration"] = configurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_attributes_configuration_supplementary_configuration_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-props-attrs-config-supp";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"attributes\":{\"configuration\":{\"supplementaryConfiguration\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-props-attrs-config-supp",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-props-attrs-config-supp",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_attributes_supplementary_configuration_configuration_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-attrs-supp-config-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string attributesJson =
            "{\"supplementaryConfiguration\":{\"configuration\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-attrs-supp-config-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-attrs-supp-config-props-ancestors",
                        ["attributes"] = attributesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_attributes_properties_supplementary_configuration_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-config-attrs-props-supp";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"attributes\":{\"properties\":{\"supplementaryConfiguration\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-config-attrs-props-supp",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-config-attrs-props-supp",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_properties_attributes_supplementary_configuration_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-props-attrs-supp-config-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string propertiesJson =
            "{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-props-attrs-supp-config-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-props-attrs-supp-config-ancestors",
                        ["properties"] = propertiesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_supplementary_configuration_attributes_configuration_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-supp-attrs-config-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"supplementaryConfiguration\":{\"attributes\":{\"configuration\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-supp-attrs-config-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-supp-attrs-config-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_supplementary_configuration_attributes_properties_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-supp-attrs-props-config-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string supplementaryConfigurationJson =
            "{\"attributes\":{\"properties\":{\"configuration\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-supp-attrs-props-config-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-supp-attrs-props-config-ancestors",
                        ["supplementaryConfiguration"] = supplementaryConfigurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_supplementary_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-config-supp-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-config-supp-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-config-supp-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_attributes_supplementary_configuration_configuration_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-props-attrs-supp-config";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-props-attrs-supp-config",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-props-attrs-supp-config",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_attributes_configuration_supplementary_configuration_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-attrs-config-supp-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string attributesJson =
            "{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-attrs-config-supp-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-attrs-config-supp-props-ancestors",
                        ["attributes"] = attributesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_supplementary_configuration_attributes_configuration_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-props-supp-attrs-config";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"supplementaryConfiguration\":{\"attributes\":{\"configuration\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-props-supp-attrs-config",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-props-supp-attrs-config",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_attributes_configuration_properties_supplementary_configuration_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-attrs-config-props-supp";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"configuration\":{\"properties\":{\"supplementaryConfiguration\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-attrs-config-props-supp",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-attrs-config-props-supp",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_supplementary_configuration_properties_attributes_configuration_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-supp-props-attrs-config";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"supplementaryConfiguration\":{\"properties\":{\"attributes\":{\"configuration\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-supp-props-attrs-config",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-supp-props-attrs-config",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_configuration_supplementary_configuration_attributes_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-config-supp-attrs-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string configurationJson =
            "{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-config-supp-attrs-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-config-supp-attrs-props-ancestors",
                        ["configuration"] = configurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_attributes_supplementary_configuration_properties_configuration_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-attrs-supp-props-config";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-attrs-supp-props-config",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-attrs-supp-props-config",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_supplementary_configuration_attributes_properties_configuration_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-supp-attrs-props-config";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"configuration\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-supp-attrs-props-config",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-supp-attrs-props-config",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_attributes_configuration_properties_supplementary_configuration_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-attrs-config-props-supp-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string attributesJson =
            "{\"configuration\":{\"properties\":{\"supplementaryConfiguration\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-attrs-config-props-supp-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-attrs-config-props-supp-ancestors",
                        ["attributes"] = attributesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_configuration_supplementary_configuration_attributes_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-props-config-supp-attrs";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"attributes\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-props-config-supp-attrs",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-props-config-supp-attrs",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_configuration_properties_supplementary_configuration_attributes_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-related-events-props-config-props-supp-attrs";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"configuration\":{\"properties\":{\"supplementaryConfiguration\":{\"attributes\":{\"parent\":\"" + parentFullName + "\"}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-props-config-props-supp-attrs",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-related-events-props-config-props-supp-attrs",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_properties_supplementary_configuration_attributes_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-related-events-config-props-supp-attrs";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"properties\":{\"supplementaryConfiguration\":{\"attributes\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-config-props-supp-attrs",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-related-events-config-props-supp-attrs",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_attributes_configuration_properties_supplementary_configuration_attributes_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-related-events-attrs-config-props-supp-attrs";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"configuration\":{\"properties\":{\"supplementaryConfiguration\":{\"attributes\":{\"parent\":\"" + parentFullName + "\"}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-attrs-config-props-supp-attrs",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-related-events-attrs-config-props-supp-attrs",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_attributes_properties_configuration_supplementary_configuration_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-related-events-attrs-props-config-supp";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-attrs-props-config-supp",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-related-events-attrs-props-config-supp",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_supplementary_configuration_attributes_configuration_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-supp-attrs-config-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string supplementaryConfigurationJson =
            "{\"attributes\":{\"configuration\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-supp-attrs-config-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-supp-attrs-config-props-ancestors",
                        ["supplementaryConfiguration"] = supplementaryConfigurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_properties_attributes_supplementary_configuration_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-config-props-attrs-supp";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"properties\":{\"attributes\":{\"supplementaryConfiguration\":{\"parent\":\"" + parentFullName + "\"}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-config-props-attrs-supp",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-config-props-attrs-supp",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_configuration_supplementary_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-props-config-supp-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-props-config-supp-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-props-config-supp-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_supplementary_configuration_properties_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-supp-props-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-supp-props-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-supp-props-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_attributes_supplementary_configuration_properties_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-attrs-supp-props-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-attrs-supp-props-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-attrs-supp-props-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-props-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-props-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-props-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_properties_attributes_supplementary_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-config-props-attrs-supp-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"properties\":{\"attributes\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-config-props-attrs-supp-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-config-props-attrs-supp-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_supplementary_configuration_configuration_properties_attributes_supplementary_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-supp-config-props-attrs-supp-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"supplementaryConfiguration\":{\"configuration\":{\"properties\":{\"attributes\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-supp-config-props-attrs-supp-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-supp-config-props-attrs-supp-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_supplementary_configuration_configuration_attributes_supplementary_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-props-supp-config-attrs-supp-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-props-supp-config-attrs-supp-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-props-supp-config-attrs-supp-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_attributes_properties_supplementary_configuration_configuration_attributes_supplementary_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-attrs-props-supp-config-attrs-supp-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"properties\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-attrs-props-supp-config-attrs-supp-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-attrs-props-supp-config-attrs-supp-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_attributes_properties_supplementary_configuration_configuration_attributes_supplementary_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-config-attrs-props-supp-config-attrs-supp-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"attributes\":{\"properties\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-config-attrs-props-supp-config-attrs-supp-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-config-attrs-props-supp-config-attrs-supp-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_supplementary_configuration_configuration_attributes_properties_supplementary_configuration_configuration_attributes_supplementary_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-supp-config-attrs-props-supp-config-attrs-supp-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-supp-config-attrs-props-supp-config-attrs-supp-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-supp-config-attrs-props-supp-config-attrs-supp-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_configuration_attributes_supplementary_configuration_configuration_attributes_supplementary_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-props-config-attrs-supp-config-attrs-supp-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-props-config-attrs-supp-config-attrs-supp-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-props-config-attrs-supp-config-attrs-supp-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_attributes_properties_supplementary_configuration_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-attrs-props-supp-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"properties\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-attrs-props-supp-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-attrs-props-supp-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_attributes_properties_supplementary_configuration_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-config-attrs-props-supp-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"attributes\":{\"properties\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-config-attrs-props-supp-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-config-attrs-props-supp-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_supplementary_configuration_properties_configuration_attributes_supplementary_configuration_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-supp-props-config-attrs-supp-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-supp-props-config-attrs-supp-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-supp-props-config-attrs-supp-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_attributes_configuration_supplementary_configuration_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-props-attrs-config-supp-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"attributes\":{\"configuration\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-props-attrs-config-supp-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-props-attrs-config-supp-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_attributes_properties_configuration_supplementary_configuration_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-attrs-props-config-supp-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-attrs-props-config-supp-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-attrs-props-config-supp-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_properties_attributes_supplementary_configuration_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-config-props-attrs-supp-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"properties\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-config-props-attrs-supp-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-config-props-attrs-supp-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_supplementary_configuration_attributes_properties_configuration_supplementary_configuration_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-supp-attrs-props-config-supp-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-supp-attrs-props-config-supp-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-supp-attrs-props-config-supp-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_attributes_configuration_properties_supplementary_configuration_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-attrs-config-props-supp-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"configuration\":{\"properties\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-attrs-config-props-supp-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-attrs-config-props-supp-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_configuration_attributes_supplementary_configuration_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-props-config-attrs-supp-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-props-config-attrs-supp-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-props-config-attrs-supp-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_supplementary_configuration_configuration_attributes_properties_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-supp-config-attrs-props-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-supp-config-attrs-props-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-supp-config-attrs-props-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_properties_configuration_attributes_supplementary_configuration_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-props-config-attrs-supp-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string propertiesJson =
            "{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-props-config-attrs-supp-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-props-config-attrs-supp-props-ancestors",
                        ["properties"] = propertiesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_attributes_supplementary_configuration_configuration_properties_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-attrs-supp-config-props-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-attrs-supp-config-props-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-attrs-supp-config-props-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_configuration_properties_attributes_supplementary_configuration_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-config-props-attrs-supp-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string configurationJson =
            "{\"properties\":{\"attributes\":{\"supplementaryConfiguration\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-config-props-attrs-supp-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-config-props-attrs-supp-props-ancestors",
                        ["configuration"] = configurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_attributes_supplementary_configuration_properties_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-config-attrs-supp-props-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-config-attrs-supp-props-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-config-attrs-supp-props-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_attributes_properties_configuration_supplementary_configuration_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-attrs-props-config-supp-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string attributesJson =
            "{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-attrs-props-config-supp-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-attrs-props-config-supp-props-ancestors",
                        ["attributes"] = attributesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_attributes_configuration_supplementary_configuration_properties_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-props-attrs-config-supp-props-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"attributes\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-props-attrs-config-supp-props-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-props-attrs-config-supp-props-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_supplementary_configuration_properties_configuration_attributes_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-supp-props-config-attrs-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string supplementaryConfigurationJson =
            "{\"properties\":{\"configuration\":{\"attributes\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-supp-props-config-attrs-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-supp-props-config-attrs-props-ancestors",
                        ["supplementaryConfiguration"] = supplementaryConfigurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_attributes_properties_configuration_supplementary_configuration_properties_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_configuration_supplementary_configuration_properties_attributes_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-config-supp-props-attrs-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string configurationJson =
            "{\"supplementaryConfiguration\":{\"properties\":{\"attributes\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-config-supp-props-attrs-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-config-supp-props-attrs-props-ancestors",
                        ["configuration"] = configurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_supplementary_configuration_attributes_properties_configuration_supplementary_configuration_properties_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-supp-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-supp-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-supp-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_properties_supplementary_configuration_configuration_attributes_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-props-supp-config-attrs-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string propertiesJson =
            "{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-props-supp-config-attrs-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-props-supp-config-attrs-props-ancestors",
                        ["properties"] = propertiesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_supplementary_configuration_attributes_properties_configuration_supplementary_configuration_properties_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-config-supp-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-config-supp-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-config-supp-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_attributes_supplementary_configuration_properties_configuration_attributes_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-attrs-supp-props-config-attrs-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string attributesJson =
            "{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"attributes\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-attrs-supp-props-config-attrs-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-attrs-supp-props-config-attrs-props-ancestors",
                        ["attributes"] = attributesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_supplementary_configuration_attributes_properties_configuration_supplementary_configuration_properties_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-props-supp-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-props-supp-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-props-supp-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_properties_configuration_supplementary_configuration_attributes_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-props-config-supp-attrs-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string propertiesJson =
            "{\"configuration\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-props-config-supp-attrs-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-props-config-supp-attrs-props-ancestors",
                        ["properties"] = propertiesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_attributes_supplementary_configuration_properties_configuration_supplementary_configuration_attributes_properties_configuration_supplementary_configuration_properties_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-attrs-supp-props-config-supp-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-attrs-supp-props-config-supp-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-attrs-supp-props-config-supp-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_attributes_properties_configuration_supplementary_configuration_attributes_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-attrs-props-config-supp-attrs-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string attributesJson =
            "{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-attrs-props-config-supp-attrs-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-attrs-props-config-supp-attrs-props-ancestors",
                        ["attributes"] = attributesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_supplementary_configuration_properties_attributes_properties_configuration_supplementary_configuration_properties_attributes_properties_configuration_supplementary_configuration_properties_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-config-supp-props-attrs-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"attributes\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"attributes\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-config-supp-props-attrs-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-config-supp-props-attrs-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_configuration_properties_supplementary_configuration_attributes_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-config-props-supp-attrs-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string configurationJson =
            "{\"properties\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-config-props-supp-attrs-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-config-props-supp-attrs-props-ancestors",
                        ["configuration"] = configurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_supplementary_configuration_properties_attributes_properties_configuration_supplementary_configuration_properties_attributes_properties_configuration_supplementary_configuration_properties_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-props-supp-props-attrs-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"supplementaryConfiguration\":{\"properties\":{\"attributes\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"attributes\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-props-supp-props-attrs-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-props-supp-props-attrs-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_supplementary_configuration_properties_configuration_supplementary_configuration_attributes_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-supp-props-config-supp-attrs-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string supplementaryConfigurationJson =
            "{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}}}";
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-supp-props-config-supp-attrs-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-supp-props-config-supp-attrs-props-ancestors",
                        ["supplementaryConfiguration"] = supplementaryConfigurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_attributes_supplementary_configuration_properties_configuration_supplementary_configuration_properties_attributes_properties_configuration_supplementary_configuration_properties_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-attrs-supp-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"attributes\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-attrs-supp-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-attrs-supp-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_attributes_supplementary_configuration_properties_configuration_supplementary_configuration_attributes_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-attrs-supp-props-config-supp-attrs-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string attributesJson =
            "{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-attrs-supp-props-config-supp-attrs-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-attrs-supp-props-config-supp-attrs-props-ancestors",
                        ["attributes"] = attributesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_supplementary_configuration_properties_configuration_supplementary_configuration_properties_attributes_properties_configuration_supplementary_configuration_properties_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-supp-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"attributes\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-supp-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-supp-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_properties_supplementary_configuration_properties_configuration_supplementary_configuration_attributes_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-props-supp-props-config-supp-attrs-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string propertiesJson =
            "{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-props-supp-props-config-supp-attrs-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-props-supp-props-config-supp-attrs-props-ancestors",
                        ["properties"] = propertiesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_supplementary_configuration_properties_configuration_supplementary_configuration_properties_attributes_properties_configuration_supplementary_configuration_properties_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-config-supp-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"attributes\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-config-supp-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-config-supp-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_configuration_supplementary_configuration_properties_configuration_supplementary_configuration_attributes_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-config-supp-props-config-supp-attrs-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string configurationJson =
            "{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-config-supp-props-config-supp-attrs-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-config-supp-props-config-supp-attrs-props-ancestors",
                        ["configuration"] = configurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_supplementary_configuration_properties_configuration_supplementary_configuration_properties_attributes_properties_configuration_supplementary_configuration_properties_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-display-name-related-events-props-supp-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props-v2";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"attributes\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-props-supp-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props-v2",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-display-name-related-events-props-supp-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props-v2",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_properties_configuration_supplementary_configuration_properties_configuration_supplementary_configuration_attributes_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-props-config-supp-props-config-supp-attrs-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string propertiesJson =
            "{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-props-config-supp-props-config-supp-attrs-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-props-config-supp-props-config-supp-attrs-props-ancestors",
                        ["properties"] = propertiesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_attributes_properties_configuration_supplementary_configuration_properties_configuration_supplementary_configuration_properties_attributes_properties_configuration_supplementary_configuration_properties_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-related-events-attrs-props-config-supp-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"attributes\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"attributes\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-attrs-props-config-supp-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-related-events-attrs-props-config-supp-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_attributes_configuration_supplementary_configuration_properties_configuration_supplementary_configuration_attributes_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-attrs-config-supp-props-config-supp-attrs-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string attributesJson =
            "{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-attrs-config-supp-props-config-supp-attrs-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-attrs-config-supp-props-config-supp-attrs-props-ancestors",
                        ["attributes"] = attributesJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_properties_attributes_configuration_supplementary_configuration_properties_configuration_supplementary_configuration_properties_attributes_properties_configuration_supplementary_configuration_properties_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-related-events-props-attrs-config-supp-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"properties\":{\"attributes\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"attributes\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-props-attrs-config-supp-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-related-events-props-attrs-config-supp-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_ancestors_in_nested_supplementary_configuration_configuration_properties_configuration_supplementary_configuration_attributes_properties_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-display-supp-config-props-config-supp-attrs-props-ancestors";

        const string ancestorsJson =
            """["//compute.googleapis.com/projects/demo-project/zones/us-central1-a"]""";

        const string supplementaryConfigurationJson =
            "{\"configuration\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"attributes\":{\"properties\":{\"ancestors\":" + ancestorsJson + "}}}}}}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-display-supp-config-props-config-supp-attrs-props-ancestors",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-display-supp-config-props-config-supp-attrs-props-ancestors",
                        ["supplementaryConfiguration"] = supplementaryConfigurationJson,
                    }
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
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_displayName_with_parent_in_related_events_configuration_attributes_properties_supplementary_configuration_properties_configuration_supplementary_configuration_properties_attributes_properties_configuration_supplementary_configuration_properties_configuration_attributes_supplementary_configuration_configuration_attributes_properties_wrapper_json()
    {
        const string projectsPath =
            "projects/demo-project/zones/us-central1-a/instances/split-parent-related-events-config-attrs-props-supp-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props";

        const string parentFullName =
            "//compute.googleapis.com/projects/demo-project/zones/us-central1-a";

        string relatedEventsWrapperJson =
            "{\"relatedEvents\":[{\"configuration\":{\"attributes\":{\"properties\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"attributes\":{\"properties\":{\"configuration\":{\"supplementaryConfiguration\":{\"properties\":{\"configuration\":{\"attributes\":{\"supplementaryConfiguration\":{\"configuration\":{\"attributes\":{\"properties\":{\"parent\":\"" + parentFullName + "\"}}}}}}}}}}}}}}}}}}}}]}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cai-topology-split-parent-related-events-config-attrs-props-supp-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                    Label = "compute_instance.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["displayName"] = "instances/split-parent-related-events-config-attrs-props-supp-props-config-supp-props-attrs-props-config-supp-props-config-attrs-supp-config-attrs-props",
                        ["relatedEvents"] = relatedEventsWrapperJson,
                    }
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
}
