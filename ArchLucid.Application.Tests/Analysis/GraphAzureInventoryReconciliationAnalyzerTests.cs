using ArchLucid.Application.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class GraphAzureInventoryReconciliationAnalyzerTests
{
    [Fact]
    public void Analyze_returns_empty_when_both_graph_and_inventory_have_no_arm_resource_ids()
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
            GraphAzureInventoryReconciliationAnalyzer.Analyze("[]", graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void Analyze_reports_inventory_only_when_graph_has_no_arm_resource_ids()
    {
        const string inventoryResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";

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
                "resourceType": "Microsoft.Compute/virtualMachines",
                "resourceId": "{{inventoryResourceId}}"
              }
            ]
            """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeTrue();
        result.GraphOnlyResourceIds.Should().BeEmpty();
        result.InventoryOnlyResourceIds.Should().ContainSingle().Which.Should().Be(inventoryResourceId.ToLowerInvariant());
    }

    [Fact]
    public void Analyze_reports_graph_only_when_resources_json_is_missing()
    {
        const string graphResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-graph";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vm-graph",
                    Properties = new Dictionary<string, string>
                    {
                        ["resourceId"] = graphResourceId
                    }
                }
            ]
        };

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(null, graph);

        result.HasMismatches.Should().BeTrue();
        result.InventorySnapshotAbsent.Should().BeTrue();
        result.GraphOnlyResourceIds.Should().ContainSingle().Which.Should().Be(graphResourceId.ToLowerInvariant());
        result.InventoryOnlyResourceIds.Should().BeEmpty();
    }

    [Fact]
    public void Analyze_reports_graph_only_and_inventory_only_resource_ids()
    {
        const string graphResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-graph";
        const string inventoryResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/live";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vm-graph",
                    Properties = new Dictionary<string, string>
                    {
                        ["resourceId"] = graphResourceId
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
            [
              {
                "resourceType": "Microsoft.Storage/storageAccounts",
                "resourceId": "{{inventoryResourceId}}"
              }
            ]
            """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.GraphOnlyResourceIds.Should().ContainSingle().Which.Should().Be(graphResourceId.ToLowerInvariant());
        result.InventoryOnlyResourceIds.Should().ContainSingle().Which.Should().Be(inventoryResourceId.ToLowerInvariant());
    }

    [Fact]
    public void Analyze_reports_graph_only_when_inventory_array_is_empty()
    {
        const string graphResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-graph";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vm-graph",
                    Properties = new Dictionary<string, string>
                    {
                        ["resourceId"] = graphResourceId
                    }
                }
            ]
        };

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze("[]", graph);

        result.HasMismatches.Should().BeTrue();
        result.GraphOnlyResourceIds.Should().ContainSingle().Which.Should().Be(graphResourceId.ToLowerInvariant());
        result.InventoryOnlyResourceIds.Should().BeEmpty();
    }

    [Fact]
    public void Analyze_reports_graph_only_when_resources_json_is_malformed()
    {
        const string graphResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-graph";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vm-graph",
                    Properties = new Dictionary<string, string>
                    {
                        ["resourceId"] = graphResourceId
                    }
                }
            ]
        };

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze("{not-json", graph);

        result.HasMismatches.Should().BeTrue();
        result.GraphOnlyResourceIds.Should().ContainSingle().Which.Should().Be(graphResourceId.ToLowerInvariant());
        result.InventoryOnlyResourceIds.Should().BeEmpty();
    }

    [Fact]
    public void Analyze_indexes_graph_resource_id_when_property_has_surrounding_whitespace()
    {
        const string graphResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-graph";
        const string paddedGraphResourceId = $"  {graphResourceId}  ";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vm-graph",
                    Properties = new Dictionary<string, string>
                    {
                        ["resourceId"] = paddedGraphResourceId
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
            [
              {
                "resourceType": "Microsoft.Compute/virtualMachines",
                "resourceId": "{{graphResourceId}}"
              }
            ]
            """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_graph_arm_id_has_trailing_slash()
    {
        const string graphResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-graph/";
        const string inventoryResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-graph";

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
                        ["resourceId"] = graphResourceId
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
            [
              {
                "resourceType": "Microsoft.Compute/virtualMachines",
                "resourceId": "{{inventoryResourceId}}"
              }
            ]
            """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_combines_subscription_id_with_relative_resourceId()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-000000000007/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/topology-resource-id";

        const string subscriptionId = "00000000-0000-0000-0000-000000000007";
        const string relativeResourceId =
            "resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/topology-resource-id";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-topology-relative-resource-id",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["subscriptionId"] = subscriptionId,
                        ["resourceId"] = relativeResourceId,
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_properties_array_bag_nests_arm_id_under_attributes()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-00000000000c/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/props-array-attributes";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-storage-array-attributes",
                    Label = "storage_account.data",
                    Properties = new Dictionary<string, string> { ["resourceId"] = armResourceId }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "properties": [
                    {
                      "attributes": {
                        "resourceId": "{{armResourceId}}"
                      }
                    }
                  ]
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_wraps_arm_id_in_properties_array_bag()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-00000000000b/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/props-array-bag";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-storage-array-bag",
                    Label = "storage_account.data",
                    Properties = new Dictionary<string, string> { ["resourceId"] = armResourceId }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "properties": [
                    {
                      "resourceId": "{{armResourceId}}"
                    }
                  ]
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_properties_object_bag_nests_arm_id_under_attributes()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-00000000000d/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/props-object-attributes";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-storage-object-attributes",
                    Label = "storage_account.data",
                    Properties = new Dictionary<string, string> { ["resourceId"] = armResourceId }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "properties": {
                    "attributes": {
                      "resourceId": "{{armResourceId}}"
                    }
                  }
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_serializes_properties_json_array_string_with_nested_attributes_arm_id()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-00000000000e/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/props-string-array-attributes";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-storage-string-array-attributes",
                    Label = "storage_account.data",
                    Properties = new Dictionary<string, string> { ["resourceId"] = armResourceId }
                }
            ]
        };

        string propertiesJson = "[{\"attributes\":{\"resourceId\":\"" + armResourceId + "\"}}]";

        string resourcesJson =
            $$"""
              [
                {
                  "properties": "{{propertiesJson.Replace("\"", "\\\"")}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_serializes_properties_json_array_string_with_arm_id()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-00000000000a/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/props-array";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-storage-array",
                    Label = "storage_account.data",
                    Properties = new Dictionary<string, string> { ["resourceId"] = armResourceId }
                }
            ]
        };

        string propertiesJson = "[{\"resourceId\":\"" + armResourceId + "\"}]";

        string resourcesJson =
            $$"""
              [
                {
                  "properties": "{{propertiesJson.Replace("\"", "\\\"")}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_serializes_properties_json_string_with_arm_id()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-000000000008/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/propsbag";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-storage",
                    Label = "storage_account.data",
                    Properties = new Dictionary<string, string> { ["resourceId"] = armResourceId }
                }
            ]
        };

        string propertiesJson = "{\"resourceId\":\"" + armResourceId + "\"}";

        string resourcesJson =
            $$"""
              [
                {
                  "properties": "{{propertiesJson.Replace("\"", "\\\"")}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_serializes_properties_json_string_with_arm_id()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-00000000000f/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/topology-props-json";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-topology-props-json",
                    Label = "storage_account.data",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] = $$"""{"resourceId":"{{armResourceId}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_serializes_properties_json_array_string_with_nested_attributes_arm_id()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-000000000011/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/topology-props-array-nested";

        string propertiesJson = "[{\"attributes\":{\"resourceId\":\"" + armResourceId + "\"}}]";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-topology-props-array-nested",
                    Label = "storage_account.data",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] = propertiesJson,
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_serializes_configuration_json_array_string_with_nested_attributes_arm_id()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-000000000014/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/topology-config-array-nested";

        string configurationJson = "[{\"attributes\":{\"resourceId\":\"" + armResourceId + "\"}}]";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-topology-config-array-nested",
                    Label = "storage_account.data",
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
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_relative_id_with_subscription_in_configuration_json()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-000000000016/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/split-sub-config";

        const string subscriptionId = "00000000-0000-0000-0000-000000000016";
        const string relativeId =
            "resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/split-sub-config";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-split-sub-config",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["id"] = relativeId,
                        ["configuration"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_relative_resourceId_with_subscription_in_properties_json_attributes()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-000000000018/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/split-sub-props-attrs";

        const string subscriptionId = "00000000-0000-0000-0000-000000000018";
        const string relativeId =
            "resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/split-sub-props-attrs";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-split-sub-props-attrs",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["resourceId"] = relativeId,
                        ["properties"] =
                            "{\"attributes\":{\"subscriptionId\":\"" + subscriptionId + "\"}}",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_relative_id_with_subscription_in_supplementary_configuration_json()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-000000000019/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/split-sub-supp-config";

        const string subscriptionId = "00000000-0000-0000-0000-000000000019";
        const string relativeId =
            "resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/split-sub-supp-config";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-split-sub-supp-config",
                    Label = "storage_account.data",
                    Properties = new Dictionary<string, string>
                    {
                        ["id"] = relativeId,
                        ["supplementaryConfiguration"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_relative_id_with_subscription_nested_under_configuration_in_properties_json()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-00000000001a/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/split-sub-nested-config";

        const string subscriptionId = "00000000-0000-0000-0000-00000000001a";
        const string relativeId =
            "resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/split-sub-nested-config";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-split-sub-nested-config",
                    Label = "virtual_network.net",
                    Properties = new Dictionary<string, string>
                    {
                        ["id"] = relativeId,
                        ["properties"] =
                            "{\"configuration\":{\"subscriptionId\":\"" + subscriptionId + "\"}}",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_flat_subscriptionId_combines_with_provider_path_in_serialized_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000020";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/sub-config-bag";

        const string providerRelativePath =
            "resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/sub-config-bag";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-sub-config-bag",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["subscriptionId"] = subscriptionId,
                        ["configuration"] = $$"""{"resourceId":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_flat_subscriptionId_combines_with_provider_path_in_serialized_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000021";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/sub-supp-config-bag";

        const string providerRelativePath =
            "resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/sub-supp-config-bag";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-sub-supp-config-bag",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["subscriptionId"] = subscriptionId,
                        ["supplementaryConfiguration"] =
                            $$"""{"resourceId":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_flat_subscriptionId_combines_with_tf_id_in_serialized_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000022";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/sub-tf-id-config-bag";

        const string providerRelativePath =
            "resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/sub-tf-id-config-bag";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-sub-tf-id-config-bag",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["subscriptionId"] = subscriptionId,
                        ["configuration"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_configuration_json_combines_with_relative_path_in_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000023";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/cross-bag-sub-supp";

        const string providerRelativePath =
            "resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/cross-bag-sub-supp";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cross-bag-sub-supp",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["supplementaryConfiguration"] =
                            $$"""{"resourceId":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_resourceGroup_in_configuration_json_combines_with_subscription_provider_path_in_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000024";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/cross-bag-rg-supp";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/cross-bag-rg-supp";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cross-bag-rg-supp",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] = """{"resourceGroup":"rg"}""",
                        ["supplementaryConfiguration"] =
                            $$"""{"selfLink":"{{managementSelfLinkWithoutResourceGroup}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_properties_json_combines_with_relative_path_in_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000025";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/cross-bag-props-attrs";

        const string providerRelativePath =
            "resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/cross-bag-props-attrs";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cross-bag-props-attrs",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["attributes"] = $$"""{"resourceId":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_flat_resourceGroup_and_subscription_in_properties_json_combine_with_provider_relative_in_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000026";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/four-way-split";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/four-way-split";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-four-way-split",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["resourceGroup"] = "rg",
                        ["properties"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["attributes"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_flat_resourceGroup_and_subscription_in_attributes_json_combine_with_provider_relative_in_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000028";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/inverted-four-way-split";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/inverted-four-way-split";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-inverted-four-way-split",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["resourceGroup"] = "rg",
                        ["attributes"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["properties"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_resourceGroup_in_configuration_and_subscription_in_properties_json_combine_with_provider_relative_in_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000029";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-split";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-split";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-split",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["configuration"] = """{"resourceGroup":"rg"}""",
                        ["supplementaryConfiguration"] =
                            $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_json_combines_with_resourceGroup_in_nested_configuration_under_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000002d";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-selflink-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-selflink-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-selflink-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}",
                        ["attributes"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_configuration_in_properties_json_combines_with_provider_relative_in_nested_supplementary_configuration_under_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000002c";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/deep-supp-config-nested";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/deep-supp-config-nested";

        string propertiesJson =
            "{\"configuration\":{\"resourceGroup\":\"rg\",\"subscriptionId\":\""
            + subscriptionId
            + "\"}}";

        string attributesJson =
            "{\"supplementaryConfiguration\":{\"tf.id\":\""
            + providerRelativePath
            + "\"}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-deep-supp-config-nested",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] = propertiesJson,
                        ["attributes"] = attributesJson,
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_configuration_in_attributes_json_combines_with_provider_relative_in_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000002b";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-attributes-bag";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/nested-config-attributes-bag";

        string attributesJson =
            "{\"configuration\":{\"resourceGroup\":\"rg\",\"subscriptionId\":\""
            + subscriptionId
            + "\"}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-attributes-bag",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                        ["attributes"] = attributesJson,
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_configuration_in_properties_json_combines_with_provider_relative_in_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000002a";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-properties-bag";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/nested-config-properties-bag";

        string propertiesJson =
            "{\"configuration\":{\"resourceGroup\":\"rg\",\"subscriptionId\":\""
            + subscriptionId
            + "\"}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-properties-bag",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] = propertiesJson,
                        ["attributes"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_configuration_json_combines_with_tf_id_in_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000027";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/cross-bag-tf-supp";

        const string providerRelativePath =
            "resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/cross-bag-tf-supp";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-cross-bag-tf-supp",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["supplementaryConfiguration"] =
                            $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_flat_resourceGroup_combines_with_subscription_provider_path_in_serialized_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000001f";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/attrs-bag-provider-path";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/attrs-bag-provider-path";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-attrs-bag-provider-path",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["resourceGroup"] = "rg",
                        ["attributes"] = $$"""{"selfLink":"{{managementSelfLinkWithoutResourceGroup}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_selfLink_omits_resourceGroups_segment_but_bag_supplies_resource_group_name()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000001e";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/rg-gap-vm";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/rg-gap-vm";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-selflink-rg-gap",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["selfLink"] = managementSelfLinkWithoutResourceGroup,
                        ["properties"] = """{"resourceGroup":"rg"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_management_selfLink_without_subscription_with_subscription_in_properties_json()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-00000000001d/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/selflink-sub-gap";

        const string subscriptionId = "00000000-0000-0000-0000-00000000001d";
        const string managementSelfLinkWithoutSubscription =
            "https://management.azure.com/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/selflink-sub-gap";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-selflink-sub-gap",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["selfLink"] = managementSelfLinkWithoutSubscription,
                        ["properties"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_relative_tf_resource_id_with_subscription_in_serialized_attributes_json()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-00000000001c/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/split-sub-tf-resource-id";

        const string subscriptionId = "00000000-0000-0000-0000-00000000001c";
        const string relativeId =
            "resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/split-sub-tf-resource-id";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-split-sub-tf-resource-id",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["tf.resource_id"] = relativeId,
                        ["attributes"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_combines_flat_relative_tf_id_with_subscription_in_configuration_json()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-00000000001b/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/split-sub-tf-id";

        const string subscriptionId = "00000000-0000-0000-0000-00000000001b";
        const string relativeId =
            "resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/split-sub-tf-id";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-split-sub-tf-id",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["tf.id"] = relativeId,
                        ["configuration"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_serializes_supplementary_configuration_json_array_string_with_nested_attributes_arm_id()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-000000000017/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/supp-config-array-nested";

        string supplementaryConfigurationJson =
            "[{\"attributes\":{\"resourceId\":\"" + armResourceId + "\"}}]";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-supp-config-array-nested",
                    Label = "storage_account.data",
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
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_serializes_supplementary_configuration_json_string_with_arm_id()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-000000000015/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/topology-supp-config-json";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-topology-supp-config-json",
                    Label = "storage_account.data",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] = $$"""{"resourceId":"{{armResourceId}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_serializes_configuration_json_string_with_arm_id()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-000000000012/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/topology-config-json";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-topology-config-json",
                    Label = "storage_account.data",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] = $$"""{"resourceId":"{{armResourceId}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_serializes_properties_json_string_with_subscription_relative_arm_id()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-000000000013/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/topology-sub-in-json";

        const string subscriptionId = "00000000-0000-0000-0000-000000000013";
        const string relativeId =
            "resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/topology-sub-in-json";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-topology-sub-in-json",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] = $$"""{"subscriptionId":"{{subscriptionId}}","id":"{{relativeId}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_serializes_properties_json_string_with_nested_attributes_arm_id()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-000000000010/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/topology-props-nested";

        string propertiesJson = "{\"attributes\":{\"resourceId\":\"" + armResourceId + "\"}}";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-topology-props-nested",
                    Label = "storage_account.data",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] = propertiesJson,
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_combines_subscription_id_with_relative_id()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-000000000006/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/topology-vm";

        const string subscriptionId = "00000000-0000-0000-0000-000000000006";
        const string relativeId =
            "resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/topology-vm";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-topology-relative-id",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["subscriptionId"] = subscriptionId,
                        ["id"] = relativeId,
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_combines_subscription_id_with_relative_resourceId_path()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-000000000009/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/inv-resource-id";

        const string subscriptionId = "00000000-0000-0000-0000-000000000009";
        const string relativeResourceId =
            "resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/inv-resource-id";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-inv-relative-resource-id",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string> { ["resourceId"] = armResourceId }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "subscriptionId": "{{subscriptionId}}",
                  "resourceId": "{{relativeResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_combines_subscription_id_with_relative_id_path()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-000000000005/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1/extensions/customScript";

        const string subscriptionId = "00000000-0000-0000-0000-000000000005";
        const string relativeId =
            "resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1/extensions/customScript";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-extension",
                    Label = "extension",
                    Properties = new Dictionary<string, string> { ["resourceId"] = armResourceId }
                }
            ]
        };

        string resourcesJson =
            $$"""
            [
              {
                "kind": "Microsoft.Compute/virtualMachines/extensions",
                "subscriptionId": "{{subscriptionId}}",
                "id": "{{relativeId}}"
              }
            ]
            """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_supplies_top_level_id_arm_path()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-000000000004/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-arg-minimal",
                    Label = "vnet",
                    Properties = new Dictionary<string, string> { ["resourceId"] = armResourceId }
                }
            ]
        };

        string resourcesJson =
            $$"""
            [
              {
                "id": "{{armResourceId}}"
              }
            ]
            """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_supplies_arm_id_only_under_properties_bag()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-000000000006/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa-props-id";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-props-id",
                    Label = "sa",
                    Properties = new Dictionary<string, string> { ["resourceId"] = armResourceId }
                }
            ]
        };

        string resourcesJson =
            $$"""
            [
              {
                "properties": {
                  "id": "{{armResourceId}}"
                }
              }
            ]
            """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_nests_resourceId_under_properties_bag()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-000000000003/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-props";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-arg-export",
                    Label = "vm",
                    Properties = new Dictionary<string, string> { ["resourceId"] = armResourceId }
                }
            ]
        };

        string resourcesJson =
            $$"""
            [
              {
                "resourceType": "Microsoft.Compute/virtualMachines",
                "properties": {
                  "resourceId": "{{armResourceId}}"
                }
              }
            ]
            """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_supplies_selfLink_property_instead_of_resourceId()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-000000000002/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        const string selfLink =
            "https://management.azure.com/subscriptions/00000000-0000-0000-0000-000000000002/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-azure-rm",
                    Label = "azurerm_storage_account.sa",
                    Properties = new Dictionary<string, string> { ["resourceId"] = armResourceId }
                }
            ]
        };

        string resourcesJson =
            $$"""
            [
              {
                "selfLink": "{{selfLink}}"
              }
            ]
            """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_bag_uses_selfLink_property()
    {
        const string armResourceId =
            "/subscriptions/00000000-0000-0000-0000-000000000001/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-1";

        const string selfLink =
            "https://management.azure.com/subscriptions/00000000-0000-0000-0000-000000000001/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-1?api-version=2021-11-01";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-azure-api",
                    Label = "azurerm_virtual_machine.app",
                    Properties = new Dictionary<string, string> { ["selfLink"] = selfLink }
                }
            ]
        };

        string resourcesJson =
            $$"""
            [
              {
                "resourceType": "Microsoft.Compute/virtualMachines",
                "resourceId": "{{armResourceId}}"
              }
            ]
            """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_topology_property_bag_uses_pascal_case_resource_id_key()
    {
        const string graphResourceId =
            "/subscriptions/00000000-0000-0000-0000-000000000001/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-1";

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
                        ["ResourceId"] = graphResourceId
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
            [
              {
                "resourceType": "Microsoft.Compute/virtualMachines",
                "resourceId": "{{graphResourceId}}"
              }
            ]
            """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void TryReadTopologyResourceId_returns_arm_id_from_tf_id_property()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app-tf";

        GraphNode node = new()
        {
            NodeId = "obj-app",
            NodeType = GraphNodeTypes.TopologyResource,
            SourceId = "decl-tf-show-json-1",
            Label = "azurerm_linux_web_app.app",
            Properties = new Dictionary<string, string>
            {
                ["tf.id"] = armId
            }
        };

        GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node).Should().Be(armId);
    }

    [Fact]
    public void TryReadTopologyResourceId_returns_arm_id_from_tf_resource_id_property()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app-tf-resource";

        GraphNode node = new()
        {
            NodeId = "obj-app",
            NodeType = GraphNodeTypes.TopologyResource,
            SourceId = "decl-tf-show-json-1",
            Label = "azurerm_linux_web_app.app",
            Properties = new Dictionary<string, string>
            {
                ["tf.resource_id"] = armId
            }
        };

        GraphAzureInventoryReconciliationAnalyzer.TryReadTopologyResourceId(node).Should().Be(armId);
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_supplies_id_property_instead_of_resourceId()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sa",
                    Properties = new Dictionary<string, string> { ["resourceId"] = armId }
                }
            ]
        };

        string resourcesJson =
            $$"""
            [
              {
                "resourceType": "Microsoft.Storage/storageAccounts",
                "id": "{{armId}}"
              }
            ]
            """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
        result.GraphOnlyResourceIds.Should().BeEmpty();
        result.InventoryOnlyResourceIds.Should().BeEmpty();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_supplies_azureResourceId_property_instead_of_resourceId()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa2";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sa",
                    Properties = new Dictionary<string, string> { ["resourceId"] = armId }
                }
            ]
        };

        string resourcesJson =
            $$"""
            [
              {
                "resourceType": "Microsoft.Storage/storageAccounts",
                "azureResourceId": "{{armId}}"
              }
            ]
            """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_supplies_resourceName_property()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa-res-name";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sa",
                    Properties = new Dictionary<string, string> { ["resourceId"] = armId }
                }
            ]
        };

        string resourcesJson =
            $$"""
            [
              {
                "resourceType": "Microsoft.Storage/storageAccounts",
                "resourceName": "{{armId}}"
              }
            ]
            """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_json_root_is_single_resource_object()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/kv-single";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "kv",
                    Properties = new Dictionary<string, string> { ["resourceId"] = armId }
                }
            ]
        };

        string resourcesJson =
            $$"""
            {
              "resourceType": "Microsoft.KeyVault/vaults",
              "resourceId": "{{armId}}"
            }
            """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_json_root_wraps_resources_array()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-wrap";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vm",
                    Properties = new Dictionary<string, string> { ["resourceId"] = armId }
                }
            ]
        };

        string resourcesJson =
            $$"""
            {
              "resources": [
                {
                  "resourceType": "Microsoft.Compute/virtualMachines",
                  "resourceId": "{{armId}}"
                }
              ]
            }
            """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_supplies_subscriptions_path_without_leading_slash()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa-no-slash";
        const string inventoryArmId =
            "subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa-no-slash";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sa",
                    Properties = new Dictionary<string, string> { ["resourceId"] = armId }
                }
            ]
        };

        string resourcesJson =
            $$"""
            [
              {
                "resourceType": "Microsoft.Storage/storageAccounts",
                "resourceId": "{{inventoryArmId}}"
              }
            ]
            """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_supplies_armResourceId_property()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-arm-col";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vm",
                    Properties = new Dictionary<string, string> { ["resourceId"] = armId }
                }
            ]
        };

        string resourcesJson =
            $$"""
            [
              {
                "resourceType": "Microsoft.Compute/virtualMachines",
                "armResourceId": "{{armId}}"
              }
            ]
            """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_supplies_tf_resource_id_property()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app-tf-inv";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "app",
                    Properties = new Dictionary<string, string> { ["resourceId"] = armId }
                }
            ]
        };

        string resourcesJson =
            $$"""
            [
              {
                "resourceType": "Microsoft.Web/sites",
                "tf.resource_id": "{{armId}}"
              }
            ]
            """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_row_uses_pascal_case_ResourceId_property()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa3";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sa",
                    Properties = new Dictionary<string, string> { ["resourceId"] = armId }
                }
            ]
        };

        string resourcesJson =
            $$"""
            [
              {
                "resourceType": "Microsoft.Storage/storageAccounts",
                "ResourceId": "{{armId}}"
              }
            ]
            """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void Analyze_reads_arm_id_from_terraform_tf_id_property()
    {
        const string graphResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app-tf";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "obj-app",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-tf-show-json-1",
                    Label = "azurerm_linux_web_app.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["tf.id"] = graphResourceId
                    }
                }
            ]
        };

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze("[]", graph);

        result.HasMismatches.Should().BeTrue();
        result.GraphOnlyResourceIds.Should().ContainSingle().Which.Should().Be(graphResourceId.ToLowerInvariant());
        result.InventoryOnlyResourceIds.Should().BeEmpty();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_flat_resourceGroup_combines_with_provider_path_in_properties_json_and_relative_resourceId_in_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000027";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/four-way-rg-props-attrs";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/four-way-rg-props-attrs";

        const string providerRelativePath =
            "resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/four-way-rg-props-attrs";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-four-way-rg-props-attrs",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["resourceGroup"] = "rg",
                        ["properties"] = $$"""{"selfLink":"{{managementSelfLinkWithoutResourceGroup}}"}""",
                        ["attributes"] = $$"""{"resourceId":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_properties_configuration_json_combines_with_relative_in_attributes_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000002c";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/deep-nested-config-supp";

        const string providerRelativePath =
            "resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/deep-nested-config-supp";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-deep-nested-config-supp",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"configuration\":{\"subscriptionId\":\"" + subscriptionId + "\"}}",
                        ["attributes"] =
                            "{\"supplementaryConfiguration\":{\"resourceId\":\"" + providerRelativePath + "\"}}",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_selfLink_in_properties_json_combines_with_resourceGroup_in_attributes_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000002d";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/selflink-nested-rg-config";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/selflink-nested-rg-config";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-selflink-nested-rg-config",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] = $$"""{"selfLink":"{{managementSelfLinkWithoutResourceGroup}}"}""",
                        ["attributes"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_properties_json_and_resourceGroup_in_attributes_json_combine_with_provider_relative_in_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000031";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-props-attrs-supp";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-props-attrs-supp";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-props-attrs-supp",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["attributes"] = """{"resourceGroup":"rg"}""",
                        ["supplementaryConfiguration"] =
                            $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_properties_json_and_resourceGroup_in_attributes_json_combine_with_provider_relative_in_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000002f";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-props-attrs-config";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-props-attrs-config";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-props-attrs-config",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["attributes"] = """{"resourceGroup":"rg"}""",
                        ["configuration"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_supplementary_configuration_json_combines_with_resourceGroup_in_nested_supplementary_configuration_under_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000030";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-selflink-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-selflink-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-selflink-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}",
                        ["properties"] =
                            """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_supplementary_configuration_json_combines_with_resourceGroup_in_nested_configuration_under_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000032";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-selflink-props-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-selflink-props-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-supp-selflink-props-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}",
                        ["properties"] =
                            """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_attributes_json_and_resourceGroup_in_configuration_json_combine_with_provider_relative_in_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000033";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-attrs-config-props";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-attrs-config-props";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-attrs-config-props",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["configuration"] = """{"resourceGroup":"rg"}""",
                        ["properties"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_configuration_json_combines_with_resourceGroup_in_nested_supplementary_configuration_under_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000032";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-supp-invert";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-supp-invert";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-supp-invert",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}",
                        ["attributes"] =
                            """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_configuration_attributes_json_combines_with_resourceGroup_in_nested_supplementary_configuration_under_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000063";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-config-attrs-attrs-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-config-attrs-attrs-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-config-attrs-attrs-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"configuration\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_configuration_json_and_resourceGroup_in_supplementary_configuration_json_combine_with_provider_relative_in_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000033";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-config-supp-attrs";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-config-supp-attrs";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-config-supp-attrs",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["supplementaryConfiguration"] = """{"resourceGroup":"rg"}""",
                        ["attributes"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_configuration_json_combines_with_resourceGroup_in_nested_supplementary_configuration_under_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000034";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-props-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-props-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-config-props-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}",
                        ["properties"] =
                            """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_supplementary_configuration_json_and_resourceGroup_in_properties_json_combine_with_provider_relative_in_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000035";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-supp-props-attrs";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-supp-props-attrs";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-supp-props-attrs",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["properties"] = """{"resourceGroup":"rg"}""",
                        ["attributes"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_supplementary_configuration_json_combines_with_resourceGroup_in_nested_configuration_under_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000003f";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-supp-selflink-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-supp-selflink-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-supp-selflink-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}",
                        ["attributes"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_supplementary_configuration_json_combines_with_resourceGroup_in_nested_configuration_under_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000036";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-supp-selflink-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-supp-selflink-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-supp-selflink-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}",
                        ["attributes"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_attributes_json_and_resourceGroup_in_supplementary_configuration_json_combine_with_provider_relative_in_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000037";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-attrs-supp-config";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-attrs-supp-config";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-attrs-supp-config",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["supplementaryConfiguration"] = """{"resourceGroup":"rg"}""",
                        ["configuration"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_supplementary_configuration_json_combines_with_resourceGroup_in_nested_supplementary_configuration_under_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000038";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-supp-config-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-supp-config-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-supp-config-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}",
                        ["configuration"] =
                            """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_supplementary_configuration_json_and_resourceGroup_in_configuration_json_combine_with_provider_relative_in_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000003b";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-supp-config-props";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-supp-config-props";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-supp-config-props",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["configuration"] = """{"resourceGroup":"rg"}""",
                        ["properties"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_attributes_json_combines_with_resourceGroup_in_nested_properties_under_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000003c";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-attrs-supp-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-attrs-supp-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-attrs-supp-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}",
                        ["supplementaryConfiguration"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_supplementary_configuration_json_and_resourceGroup_in_attributes_json_combine_with_provider_relative_in_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000003d";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-supp-attrs-config";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-supp-attrs-config";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-supp-attrs-config",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["attributes"] = """{"resourceGroup":"rg"}""",
                        ["configuration"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_properties_json_and_resourceGroup_in_configuration_json_combine_with_provider_relative_in_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000004a";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-props-config-attrs";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-props-config-attrs";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-props-config-attrs",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["configuration"] = """{"resourceGroup":"rg"}""",
                        ["attributes"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_supplementary_configuration_json_and_resourceGroup_in_configuration_json_combine_with_provider_relative_in_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000004c";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-supp-config-attrs";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-supp-config-attrs";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-supp-config-attrs",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["configuration"] = """{"resourceGroup":"rg"}""",
                        ["attributes"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_properties_configuration_json_combines_with_resourceGroup_in_nested_supplementary_configuration_under_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000004b";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-props-config-props-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-props-config-props-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-props-config-props-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"properties\":{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_configuration_json_and_resourceGroup_in_attributes_json_combine_with_provider_relative_in_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000048";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-config-attrs-props";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-config-attrs-props";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-config-attrs-props",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["attributes"] = """{"resourceGroup":"rg"}""",
                        ["properties"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_supplementary_configuration_json_and_resourceGroup_in_properties_json_combine_with_provider_relative_in_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000004d";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-supp-props-config";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-supp-props-config";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-supp-props-config",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["properties"] = """{"resourceGroup":"rg"}""",
                        ["configuration"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_attributes_json_and_resourceGroup_in_supplementary_configuration_json_combine_with_provider_relative_in_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000004f";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-attrs-supp-props";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-attrs-supp-props";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-attrs-supp-props",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["supplementaryConfiguration"] = """{"resourceGroup":"rg"}""",
                        ["properties"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_attributes_configuration_json_combines_with_resourceGroup_in_nested_configuration_under_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000004d";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-attrs-config-props-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-attrs-config-props-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-attrs-config-props-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"attributes\":{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_supplementary_configuration_configuration_json_combines_with_resourceGroup_in_nested_properties_under_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000062";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-config-config-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-config-config-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-supp-config-config-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"supplementaryConfiguration\":{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_properties_configuration_json_combines_with_resourceGroup_in_nested_attributes_under_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000050";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-props-config-config-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-props-config-config-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-props-config-config-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"properties\":{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"attributes":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_properties_json_and_resourceGroup_in_configuration_json_combine_with_provider_relative_in_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000052";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-props-config-supp";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-props-config-supp";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-props-config-supp",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["configuration"] = """{"resourceGroup":"rg"}""",
                        ["supplementaryConfiguration"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_attributes_json_and_resourceGroup_in_configuration_json_combine_with_provider_relative_in_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000054";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-attrs-config-supp";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-attrs-config-supp";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-attrs-config-supp",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["configuration"] = """{"resourceGroup":"rg"}""",
                        ["supplementaryConfiguration"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_supplementary_configuration_configuration_json_combines_with_resourceGroup_in_nested_configuration_under_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000055";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-supp-config-attrs-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-supp-config-attrs-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-supp-config-attrs-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"supplementaryConfiguration\":{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_supplementary_configuration_json_and_resourceGroup_in_attributes_json_combine_with_provider_relative_in_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000057";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-supp-attrs-props";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-supp-attrs-props";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-supp-attrs-props",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["attributes"] = """{"resourceGroup":"rg"}""",
                        ["properties"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_attributes_configuration_json_combines_with_resourceGroup_in_nested_supplementary_configuration_under_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000058";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-attrs-config-config-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-attrs-config-config-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-attrs-config-config-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"attributes\":{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_configuration_properties_json_combines_with_resourceGroup_in_nested_supplementary_configuration_under_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000059";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-config-props-attrs-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-config-props-attrs-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-config-props-attrs-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"configuration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_properties_json_and_resourceGroup_in_supplementary_configuration_json_combine_with_provider_relative_in_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000060";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-props-supp-config";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-props-supp-config";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-props-supp-config",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["supplementaryConfiguration"] = """{"resourceGroup":"rg"}""",
                        ["configuration"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_supplementary_configuration_configuration_json_combines_with_resourceGroup_in_nested_attributes_under_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000061";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-config-props-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-config-props-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-supp-config-props-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"supplementaryConfiguration\":{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"attributes":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_supplementary_configuration_properties_json_combines_with_resourceGroup_in_nested_attributes_under_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000063";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-supp-props-props-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-supp-props-props-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-supp-props-props-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"supplementaryConfiguration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"attributes":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_attributes_supplementary_configuration_json_combines_with_resourceGroup_in_nested_supplementary_configuration_under_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000062";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-attrs-supp-supp-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-attrs-supp-supp-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-attrs-supp-supp-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"attributes\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["supplementaryConfiguration"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_configuration_supplementary_configuration_json_combines_with_resourceGroup_in_nested_properties_under_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000064";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-supp-supp-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-supp-supp-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-config-supp-supp-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"configuration\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["supplementaryConfiguration"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_configuration_supplementary_configuration_json_combines_with_resourceGroup_in_nested_supplementary_configuration_under_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000056";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-supp-props-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-supp-props-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-config-supp-props-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"configuration\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_supplementary_configuration_attributes_json_combines_with_resourceGroup_in_nested_configuration_under_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000053";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-supp-attrs-props-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-supp-attrs-props-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-supp-attrs-props-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"supplementaryConfiguration\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_supplementary_configuration_properties_json_combines_with_resourceGroup_in_nested_configuration_under_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000051";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-props-supp-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-props-supp-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-supp-props-supp-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"supplementaryConfiguration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["supplementaryConfiguration"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_properties_supplementary_configuration_json_combines_with_resourceGroup_in_nested_attributes_under_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000004e";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-props-supp-props-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-props-supp-props-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-props-supp-props-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"properties\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"attributes":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_configuration_supplementary_configuration_json_combines_with_resourceGroup_in_nested_properties_under_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000004c";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-config-supp-attrs-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-config-supp-attrs-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-config-supp-attrs-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"configuration\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_attributes_configuration_json_combines_with_resourceGroup_in_nested_properties_under_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000049";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-attrs-config-supp-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-attrs-config-supp-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-attrs-config-supp-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"attributes\":{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["supplementaryConfiguration"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_attributes_json_and_resourceGroup_in_properties_json_combine_with_provider_relative_in_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000046";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-attrs-props-config";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-attrs-props-config";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-attrs-props-config",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["properties"] = """{"resourceGroup":"rg"}""",
                        ["configuration"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_supplementary_configuration_properties_json_combines_with_resourceGroup_in_nested_configuration_under_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000047";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-supp-props-attrs-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-supp-props-attrs-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-supp-props-attrs-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"supplementaryConfiguration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_supplementary_configuration_properties_json_combines_with_resourceGroup_in_nested_configuration_under_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000045";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-props-props-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-props-props-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-supp-props-props-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"supplementaryConfiguration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_configuration_json_and_resourceGroup_in_properties_json_combine_with_provider_relative_in_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000042";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-config-props-attrs";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-config-props-attrs";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-config-props-attrs",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["properties"] = """{"resourceGroup":"rg"}""",
                        ["attributes"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_supplementary_configuration_attributes_json_combines_with_resourceGroup_in_nested_properties_under_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000043";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-supp-attrs-config-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-supp-attrs-config-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-supp-attrs-config-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"supplementaryConfiguration\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_configuration_json_and_resourceGroup_in_properties_json_combine_with_provider_relative_in_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000040";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-config-props-supp";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-config-props-supp";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-config-props-supp",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["properties"] = """{"resourceGroup":"rg"}""",
                        ["supplementaryConfiguration"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_attributes_json_combines_with_resourceGroup_in_nested_properties_under_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000041";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-attrs-config-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-attrs-config-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-attrs-config-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}",
                        ["configuration"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_properties_json_and_resourceGroup_in_supplementary_configuration_json_combine_with_provider_relative_in_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000003f";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-props-supp-attrs";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-props-supp-attrs";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-props-supp-attrs",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["supplementaryConfiguration"] = """{"resourceGroup":"rg"}""",
                        ["attributes"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_attributes_json_and_resourceGroup_in_properties_json_combine_with_provider_relative_in_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000064";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-attrs-props-supp";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-attrs-props-supp";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-attrs-props-supp",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["properties"] = """{"resourceGroup":"rg"}""",
                        ["supplementaryConfiguration"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_properties_attributes_json_combines_with_resourceGroup_in_nested_supplementary_configuration_under_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000065";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-props-attrs-config-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-props-attrs-config-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-props-attrs-config-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"properties\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_properties_supplementary_configuration_json_combines_with_resourceGroup_in_nested_configuration_under_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000066";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-props-supp-props-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-props-supp-props-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-props-supp-props-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"properties\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_properties_attributes_json_combines_with_resourceGroup_in_nested_supplementary_configuration_under_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000067";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-props-attrs-attrs-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-props-attrs-attrs-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-props-attrs-attrs-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"properties\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_configuration_supplementary_configuration_json_combines_with_resourceGroup_in_nested_attributes_under_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000068";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-config-supp-config-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-config-supp-config-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-config-supp-config-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"configuration\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"attributes":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_attributes_supplementary_configuration_json_combines_with_resourceGroup_in_nested_properties_under_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000069";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-attrs-supp-config-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-attrs-supp-config-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-attrs-supp-config-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"attributes\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_configuration_json_and_resourceGroup_in_supplementary_configuration_json_combine_with_provider_relative_in_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000070";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-config-supp-props";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-config-supp-props";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-config-supp-props",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["supplementaryConfiguration"] = """{"resourceGroup":"rg"}""",
                        ["properties"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_attributes_properties_json_combines_with_resourceGroup_in_nested_configuration_under_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000071";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-attrs-props-attrs-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-attrs-props-attrs-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-attrs-props-attrs-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"attributes\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_configuration_properties_json_combines_with_resourceGroup_in_nested_supplementary_configuration_under_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000072";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-props-props-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-props-props-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-config-props-props-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"configuration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_supplementary_configuration_attributes_json_combines_with_resourceGroup_in_nested_properties_under_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000073";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-supp-attrs-attrs-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-supp-attrs-attrs-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-supp-attrs-attrs-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"supplementaryConfiguration\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_configuration_properties_json_combines_with_resourceGroup_in_nested_configuration_under_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000074";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-config-props-props-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-config-props-props-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-config-props-props-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"configuration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_supplementary_configuration_configuration_json_combines_with_resourceGroup_in_nested_supplementary_configuration_under_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000075";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-supp-config-attrs-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-supp-config-attrs-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-supp-config-attrs-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"supplementaryConfiguration\":{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_properties_supplementary_configuration_json_combines_with_resourceGroup_in_nested_attributes_under_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000076";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-props-supp-supp-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-props-supp-supp-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-props-supp-supp-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"properties\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["supplementaryConfiguration"] = """{"attributes":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_properties_configuration_json_combines_with_resourceGroup_in_nested_supplementary_configuration_under_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000078";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-props-config-attrs-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-props-config-attrs-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-props-config-attrs-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"properties\":{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_properties_configuration_json_combines_with_resourceGroup_in_nested_configuration_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000077";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-props-config-config-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-props-config-config-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-props-config-config-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"properties\":{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_properties_attributes_json_combines_with_resourceGroup_in_nested_supplementary_configuration_under_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000079";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-props-attrs-props-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-props-attrs-props-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-props-attrs-props-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"properties\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_configuration_supplementary_configuration_json_combines_with_resourceGroup_in_nested_configuration_under_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000007a";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-config-supp-attrs-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-config-supp-attrs-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-config-supp-attrs-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"configuration\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_supplementary_configuration_properties_json_combines_with_resourceGroup_in_nested_attributes_under_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000007b";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-props-config-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-props-config-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-supp-props-config-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"supplementaryConfiguration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"attributes":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_supplementary_configuration_configuration_json_combines_with_resourceGroup_in_nested_properties_under_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000007c";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-supp-config-attrs-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-supp-config-attrs-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-supp-config-attrs-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"supplementaryConfiguration\":{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_configuration_properties_json_combines_with_resourceGroup_in_nested_attributes_under_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000007d";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-props-supp-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-props-supp-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-config-props-supp-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"configuration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["supplementaryConfiguration"] = """{"attributes":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_configuration_properties_json_combines_with_resourceGroup_in_nested_attributes_under_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000007e";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-config-props-config-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-config-props-config-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-config-props-config-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"configuration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"attributes":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_supplementary_configuration_attributes_json_combines_with_resourceGroup_in_nested_configuration_under_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000007f";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-supp-attrs-attrs-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-supp-attrs-attrs-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-supp-attrs-attrs-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"supplementaryConfiguration\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_properties_supplementary_configuration_json_combines_with_resourceGroup_in_nested_supplementary_configuration_under_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000080";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-props-supp-config-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-props-supp-config-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-props-supp-config-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"properties\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_subscription_in_configuration_json_and_resourceGroup_in_attributes_json_combine_with_provider_relative_in_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000081";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/three-bag-config-attrs-supp";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/three-bag-config-attrs-supp";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-three-bag-config-attrs-supp",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                        ["attributes"] = """{"resourceGroup":"rg"}""",
                        ["supplementaryConfiguration"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_attributes_properties_json_combines_with_resourceGroup_in_nested_configuration_under_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000082";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-attrs-props-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-attrs-props-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-attrs-props-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"attributes\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_attributes_properties_json_combines_with_resourceGroup_in_nested_configuration_under_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000083";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-attrs-props-supp-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-attrs-props-supp-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-attrs-props-supp-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"attributes\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["supplementaryConfiguration"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_attributes_supplementary_configuration_json_combines_with_resourceGroup_in_nested_properties_under_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000084";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-attrs-supp-attrs-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-attrs-supp-attrs-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-attrs-supp-attrs-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"attributes\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_properties_attributes_json_combines_with_resourceGroup_in_nested_properties_under_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000085";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-props-attrs-config-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-props-attrs-config-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-props-attrs-config-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"properties\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_configuration_supplementary_configuration_json_combines_with_resourceGroup_in_supplementary_configuration_under_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000086";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-config-supp-attrs-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-config-supp-attrs-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-config-supp-attrs-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"configuration\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_does_not_combine_parent_node_subscription_with_child_provider_relative_on_linked_topology_nodes()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000002e";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/parent-sub-split";

        const string providerRelativePath =
            "providers/Microsoft.Compute/virtualMachines/parent-sub-split";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "parent-sub",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-parent-subscription-only",
                    Label = "subscription.scope",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] = $$"""{"subscriptionId":"{{subscriptionId}}"}""",
                    }
                },
                new GraphNode
                {
                    NodeId = "child-vm",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-child-provider-relative-only",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] = $$"""{"tf.id":"{{providerRelativePath}}"}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeTrue();
        result.InventoryOnlyResourceIds.Should().ContainSingle().Which.Should().Be(armResourceId.ToLowerInvariant());
        result.GraphOnlyResourceIds.Should().NotContain(armResourceId.ToLowerInvariant());
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_attributes_properties_json_combines_with_resourceGroup_in_supplementary_configuration_under_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-000000000099";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-attrs-props-attrs-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-attrs-props-attrs-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-attrs-props-attrs-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"attributes\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_supplementary_configuration_attributes_json_combines_with_resourceGroup_in_configuration_under_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000009a";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-supp-attrs-supp-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-supp-attrs-supp-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-supp-attrs-supp-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"supplementaryConfiguration\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["supplementaryConfiguration"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_configuration_attributes_json_combines_with_resourceGroup_in_configuration_under_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000009b";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-config-attrs-props-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-config-attrs-props-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-config-attrs-props-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"configuration\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_configuration_supplementary_configuration_json_combines_with_resourceGroup_in_nested_attributes_under_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000009c";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-config-supp-supp-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-config-supp-supp-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-config-supp-supp-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"configuration\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["supplementaryConfiguration"] = """{"attributes":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_supplementary_configuration_configuration_json_combines_with_resourceGroup_in_configuration_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000009e";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-supp-config-config-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-supp-config-config-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-supp-config-config-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"supplementaryConfiguration\":{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"attributes":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_properties_supplementary_configuration_json_combines_with_resourceGroup_in_attributes_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-00000000009f";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-props-supp-attrs-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-props-supp-attrs-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-props-supp-attrs-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"properties\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_attributes_properties_json_combines_with_resourceGroup_in_properties_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000a0";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-attrs-props-props-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-attrs-props-props-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-attrs-props-props-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"attributes\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"attributes":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_attributes_supplementary_configuration_json_combines_with_resourceGroup_in_attributes_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000a1";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-attrs-supp-attrs-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-attrs-supp-attrs-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-attrs-supp-attrs-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"attributes\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_configuration_supplementary_configuration_json_combines_with_resourceGroup_in_properties_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000a2";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-supp-props-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-supp-props-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-config-supp-props-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"configuration\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"attributes":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_supplementary_configuration_attributes_json_combines_with_resourceGroup_in_attributes_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000a3";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-supp-attrs-attrs-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-supp-attrs-attrs-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-supp-attrs-attrs-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"supplementaryConfiguration\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_properties_configuration_json_combines_with_resourceGroup_in_supplementary_configuration_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000a4";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-props-config-supp-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-props-config-supp-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-props-config-supp-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"properties\":{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["supplementaryConfiguration"] = """{"attributes":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_configuration_attributes_json_combines_with_resourceGroup_in_configuration_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000a5";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-config-attrs-config-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-config-attrs-config-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-config-attrs-config-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"configuration\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_properties_attributes_json_combines_with_resourceGroup_in_attributes_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000a6";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-props-attrs-attrs-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-props-attrs-attrs-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-props-attrs-attrs-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"properties\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_attributes_supplementary_configuration_json_combines_with_resourceGroup_in_properties_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000a7";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-attrs-supp-props-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-attrs-supp-props-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-attrs-supp-props-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"attributes\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"attributes":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_properties_supplementary_configuration_json_combines_with_resourceGroup_in_configuration_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000a8";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-props-supp-config-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-props-supp-config-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-props-supp-config-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"properties\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"attributes":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_properties_supplementary_configuration_json_combines_with_resourceGroup_in_attributes_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000a9";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-props-supp-attrs-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-props-supp-attrs-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-props-supp-attrs-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"properties\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_properties_configuration_json_combines_with_resourceGroup_in_properties_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000aa";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-props-config-props-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-props-config-props-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-props-config-props-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"properties\":{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"attributes":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_supplementary_configuration_configuration_json_combines_with_resourceGroup_in_attributes_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000ab";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-supp-config-attrs-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-supp-config-attrs-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-supp-config-attrs-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"supplementaryConfiguration\":{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_attributes_properties_json_combines_with_resourceGroup_in_configuration_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000ac";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-attrs-props-config-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-attrs-props-config-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-attrs-props-config-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"attributes\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_configuration_supplementary_configuration_json_combines_with_resourceGroup_in_attributes_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000ad";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-config-supp-attrs-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-config-supp-attrs-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-config-supp-attrs-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"configuration\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_supplementary_configuration_properties_json_combines_with_resourceGroup_in_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000ae";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-props-config-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-props-config-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-supp-props-config-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"supplementaryConfiguration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_attributes_supplementary_configuration_json_combines_with_resourceGroup_in_supplementary_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000af";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-attrs-supp-supp-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-attrs-supp-supp-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-attrs-supp-supp-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"attributes\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["supplementaryConfiguration"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_supplementary_configuration_attributes_json_combines_with_resourceGroup_in_configuration_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000b8";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-supp-attrs-config-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-supp-attrs-config-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-supp-attrs-config-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"supplementaryConfiguration\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_configuration_properties_json_combines_with_resourceGroup_in_supplementary_configuration_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000b9";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-props-supp-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-props-supp-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-config-props-supp-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"configuration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["supplementaryConfiguration"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_attributes_configuration_json_combines_with_resourceGroup_in_supplementary_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000ba";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-attrs-config-supp-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-attrs-config-supp-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-attrs-config-supp-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"attributes\":{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["supplementaryConfiguration"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_configuration_supplementary_configuration_json_combines_with_resourceGroup_in_properties_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000bb";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-supp-props-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-supp-props-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-config-supp-props-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"configuration\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_attributes_configuration_json_combines_with_resourceGroup_in_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000bc";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-attrs-config-config-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-attrs-config-config-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-attrs-config-config-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"attributes\":{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_attributes_supplementary_configuration_json_combines_with_resourceGroup_in_properties_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000bd";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-attrs-supp-props-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-attrs-supp-props-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-attrs-supp-props-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"attributes\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_configuration_attributes_json_combines_with_resourceGroup_in_attributes_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000be";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-config-attrs-attrs-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-config-attrs-attrs-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-config-attrs-attrs-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"configuration\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_configuration_properties_json_combines_with_resourceGroup_in_supplementary_configuration_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000bf";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-props-supp-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-props-supp-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-config-props-supp-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"configuration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["supplementaryConfiguration"] = """{"attributes":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_supplementary_configuration_attributes_json_combines_with_resourceGroup_in_attributes_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000c0";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-supp-attrs-attrs-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-supp-attrs-attrs-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-supp-attrs-attrs-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"supplementaryConfiguration\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_supplementary_configuration_properties_json_combines_with_resourceGroup_in_attributes_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000c1";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-supp-props-attrs-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-supp-props-attrs-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-supp-props-attrs-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"supplementaryConfiguration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_supplementary_configuration_properties_json_combines_with_resourceGroup_in_properties_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000c2";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-supp-props-props-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-supp-props-props-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-supp-props-props-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"supplementaryConfiguration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"configuration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_properties_configuration_json_combines_with_resourceGroup_in_attributes_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000c3";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-props-config-attrs-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-props-config-attrs-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-props-config-attrs-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"properties\":{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_properties_configuration_json_combines_with_resourceGroup_in_supplementary_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000c4";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-props-config-supp-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-props-config-supp-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-props-config-supp-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"properties\":{\"configuration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["supplementaryConfiguration"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_configuration_supplementary_configuration_json_combines_with_resourceGroup_in_attributes_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000c5";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-config-supp-attrs-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-config-supp-attrs-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-config-supp-attrs-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"configuration\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_properties_supplementary_configuration_json_combines_with_resourceGroup_in_supplementary_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000c6";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-props-supp-supp-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-props-supp-supp-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-props-supp-supp-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"properties\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["supplementaryConfiguration"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_configuration_properties_json_combines_with_resourceGroup_in_properties_supplementary_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000c7";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-props-props-supp-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-props-props-supp-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-config-props-props-supp-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"configuration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"supplementaryConfiguration":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_configuration_properties_json_combines_with_resourceGroup_in_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000c8";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-config-props-config-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-config-props-config-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-config-props-config-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"configuration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_supplementary_configuration_properties_json_combines_with_resourceGroup_in_attributes_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000c9";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-supp-props-attrs-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-supp-props-attrs-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-supp-props-attrs-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"supplementaryConfiguration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_supplementary_configuration_properties_json_combines_with_resourceGroup_in_attributes_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000c2";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-supp-props-attrs-config-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-supp-props-attrs-config-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-supp-props-attrs-config-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"supplementaryConfiguration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"configuration":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_supplementary_configuration_properties_json_combines_with_resourceGroup_in_attributes_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000ca";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-supp-props-attrs-config-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-supp-props-attrs-config-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-supp-props-attrs-config-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"supplementaryConfiguration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"configuration":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_properties_json_combines_with_resourceGroup_in_properties_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000cb";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-props-props-config-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-props-props-config-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-props-props-config-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}",
                        ["properties"] = """{"configuration":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_properties_json_combines_with_resourceGroup_in_supplementary_configuration_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000cc";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-props-supp-config-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-props-supp-config-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-props-supp-config-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}",
                        ["supplementaryConfiguration"] =
                            """{"configuration":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_properties_json_combines_with_resourceGroup_in_attributes_supplementary_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000cd";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-props-attrs-supp-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-props-attrs-supp-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-props-attrs-supp-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}",
                        ["attributes"] =
                            """{"supplementaryConfiguration":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_attributes_json_combines_with_resourceGroup_in_configuration_supplementary_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000ce";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-attrs-config-supp-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-attrs-config-supp-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-attrs-config-supp-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}",
                        ["configuration"] =
                            """{"supplementaryConfiguration":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_attributes_json_combines_with_resourceGroup_in_properties_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000cf";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-attrs-props-config-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-attrs-props-config-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-attrs-props-config-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}",
                        ["properties"] = """{"configuration":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_supplementary_configuration_json_combines_with_resourceGroup_in_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000d0";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-config-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-config-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-supp-config-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}",
                        ["configuration"] = """{"properties":{"resourceGroup":"rg"}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_supplementary_configuration_json_combines_with_resourceGroup_in_properties_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000d1";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-supp-config-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-supp-config-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-supp-config-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}",
                        ["properties"] = """{"configuration":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_supplementary_configuration_json_combines_with_resourceGroup_in_attributes_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000d2";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-supp-attrs-config-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-supp-attrs-config-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-supp-attrs-config-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}",
                        ["attributes"] = """{"configuration":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_properties_json_combines_with_resourceGroup_in_configuration_attributes_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000d3";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-props-config-attrs-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-props-config-attrs-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-props-config-attrs-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}",
                        ["configuration"] = """{"attributes":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_supplementary_configuration_properties_json_combines_with_resourceGroup_in_properties_configuration_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000d4";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-props-props-config-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-props-props-config-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-supp-props-props-config-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"supplementaryConfiguration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"configuration":{"attributes":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_attributes_supplementary_configuration_json_combines_with_resourceGroup_in_configuration_supplementary_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000d5";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-attrs-supp-config-supp-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-attrs-supp-config-supp-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-attrs-supp-config-supp-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"attributes\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] =
                            """{"supplementaryConfiguration":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_properties_supplementary_configuration_json_combines_with_resourceGroup_in_properties_configuration_supplementary_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000d6";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-props-supp-props-config-supp-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-props-supp-props-config-supp-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-props-supp-props-config-supp-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"properties\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] =
                            """{"configuration":{"supplementaryConfiguration":{"properties":{"resourceGroup":"rg"}}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_configuration_attributes_json_combines_with_resourceGroup_in_attributes_supplementary_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000d7";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-config-attrs-attrs-supp-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-config-attrs-attrs-supp-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-config-attrs-attrs-supp-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"configuration\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] =
                            """{"supplementaryConfiguration":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_properties_attributes_json_combines_with_resourceGroup_in_properties_supplementary_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000d8";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-props-attrs-props-supp-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-props-attrs-props-supp-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-props-attrs-props-supp-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"properties\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] =
                            """{"supplementaryConfiguration":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_configuration_properties_json_combines_with_resourceGroup_in_configuration_supplementary_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000d9";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-props-config-supp-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-props-config-supp-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-config-props-config-supp-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"configuration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] =
                            """{"supplementaryConfiguration":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_properties_attributes_json_combines_with_resourceGroup_in_attributes_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000da";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-props-attrs-attrs-config-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-props-attrs-attrs-config-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-props-attrs-attrs-config-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"properties\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] =
                            """{"configuration":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_supplementary_configuration_attributes_json_combines_with_resourceGroup_in_supplementary_configuration_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000db";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-supp-attrs-supp-config-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-supp-attrs-supp-config-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-supp-attrs-supp-config-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"supplementaryConfiguration\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["supplementaryConfiguration"] =
                            """{"configuration":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_supplementary_configuration_attributes_json_combines_with_resourceGroup_in_attributes_supplementary_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000dc";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-supp-attrs-attrs-supp-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-supp-attrs-attrs-supp-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-supp-attrs-attrs-supp-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"supplementaryConfiguration\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] =
                            """{"supplementaryConfiguration":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_supplementary_configuration_attributes_json_combines_with_resourceGroup_in_properties_supplementary_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000dd";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-attrs-props-supp-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-attrs-props-supp-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-supp-attrs-props-supp-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"supplementaryConfiguration\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] =
                            """{"supplementaryConfiguration":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_properties_attributes_json_combines_with_resourceGroup_in_configuration_attributes_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000de";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-props-attrs-config-attrs-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-props-attrs-config-attrs-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-props-attrs-config-attrs-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"properties\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] =
                            """{"attributes":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_configuration_attributes_json_combines_with_resourceGroup_in_supplementary_configuration_attributes_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000df";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-config-attrs-supp-attrs-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-config-attrs-supp-attrs-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-config-attrs-supp-attrs-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"configuration\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["supplementaryConfiguration"] =
                            """{"attributes":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_configuration_attributes_json_combines_with_resourceGroup_in_properties_supplementary_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000e0";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-attrs-props-supp-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-attrs-props-supp-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-config-attrs-props-supp-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"configuration\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] =
                            """{"supplementaryConfiguration":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_configuration_attributes_json_combines_with_resourceGroup_in_attributes_supplementary_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000e1";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-config-attrs-attrs-supp-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-config-attrs-attrs-supp-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-config-attrs-attrs-supp-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"configuration\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] =
                            """{"supplementaryConfiguration":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_configuration_attributes_json_combines_with_resourceGroup_in_attributes_properties_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000bf";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-config-attrs-attrs-props-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-config-attrs-attrs-props-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-config-attrs-attrs-props-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"configuration\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["attributes"] = """{"properties":{"configuration":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_supplementary_configuration_attributes_json_combines_with_resourceGroup_in_configuration_properties_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000c0";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-supp-attrs-config-props-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-supp-attrs-config-props-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-supp-attrs-config-props-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"supplementaryConfiguration\":{\"attributes\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"properties":{"attributes":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_supplementary_configuration_properties_json_combines_with_resourceGroup_in_configuration_properties_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000c1";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-props-config-props-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-props-config-props-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-supp-props-config-props-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"supplementaryConfiguration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"properties":{"attributes":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_supplementary_configuration_properties_json_combines_with_resourceGroup_in_supplementary_configuration_configuration_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000c1";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-props-supp-config-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-supp-props-supp-config-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-supp-props-supp-config-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"supplementaryConfiguration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["supplementaryConfiguration"] = """{"configuration":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_configuration_properties_supplementary_configuration_json_combines_with_resourceGroup_in_properties_attributes_configuration_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000c2";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-config-props-supp-props-attrs-config-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-config-props-supp-props-attrs-config-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-config-props-supp-props-attrs-config-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["configuration"] =
                            "{\"properties\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"attributes":{"configuration":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_supplementary_configuration_attributes_properties_json_combines_with_resourceGroup_in_configuration_supplementary_configuration_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000c3";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-supp-attrs-props-config-supp-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-supp-attrs-props-config-supp-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-supp-attrs-props-config-supp-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["supplementaryConfiguration"] =
                            "{\"attributes\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["configuration"] = """{"supplementaryConfiguration":{"attributes":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_attributes_configuration_properties_json_combines_with_resourceGroup_in_properties_supplementary_configuration_attributes_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000c4";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-props-supp-attrs-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-attrs-config-props-supp-attrs-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-attrs-config-props-supp-attrs-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["attributes"] =
                            "{\"configuration\":{\"properties\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["properties"] = """{"supplementaryConfiguration":{"attributes":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }

    [Fact]
    public void CompareQuality_Analyze_matches_inventory_when_nested_selfLink_in_properties_configuration_supplementary_configuration_json_combines_with_resourceGroup_in_supplementary_configuration_attributes_properties_json()
    {
        const string subscriptionId = "00000000-0000-0000-0000-0000000000c6";
        const string armResourceId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/nested-props-config-supp-supp-attrs-props-rg";

        const string managementSelfLinkWithoutResourceGroup =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Compute/virtualMachines/nested-props-config-supp-supp-attrs-props-rg";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    SourceId = "decl-nested-props-config-supp-supp-attrs-props-rg",
                    Label = "virtual_machine.app",
                    Properties = new Dictionary<string, string>
                    {
                        ["properties"] =
                            "{\"configuration\":{\"supplementaryConfiguration\":{\"selfLink\":\"" + managementSelfLinkWithoutResourceGroup + "\"}}}",
                        ["supplementaryConfiguration"] = """{"attributes":{"properties":{"resourceGroup":"rg"}}}""",
                    }
                }
            ]
        };

        string resourcesJson =
            $$"""
              [
                {
                  "resourceId": "{{armResourceId}}"
                }
              ]
              """;

        InventoryReconciliationResult result =
            GraphAzureInventoryReconciliationAnalyzer.Analyze(resourcesJson, graph);

        result.HasMismatches.Should().BeFalse();
    }
}
