using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class TopologyProposalRelationshipEdgeMapperTests
{
    [Fact]
    public void MapRelationships_MapsCallsToConnectsToEdge()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [new ManifestRelationship { SourceId = "svc-1", TargetId = "ds-1", RelationshipType = RelationshipType.ReadsFrom }]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_maps_AuthenticatesWith_to_DependsOn_edge()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-api",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "svc-idp",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "idp",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [new ManifestRelationship { SourceId = "svc-api", TargetId = "svc-idp", RelationshipType = RelationshipType.AuthenticatesWith }]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-api" &&
            e.ToNodeId == "svc-idp" &&
            e.EdgeType == GraphEdgeTypes.DependsOn);
    }

    [Fact]
    public void MapRelationships_maps_WritesTo_to_ConnectsTo_edge()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [new ManifestRelationship { SourceId = "svc-1", TargetId = "ds-1", RelationshipType = RelationshipType.WritesTo }]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_endpoints_keyed_by_graph_source_id()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                SourceType = "Terraform",
                SourceId = "azurerm_app_service.main",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                SourceType = "Terraform",
                SourceId = "azurerm_mssql_server.main",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "azurerm_app_service.main",
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_endpoints_keyed_by_arm_resource_id_property()
    {
        const string vmResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-graph";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "t1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "vm-graph",
                Category = GraphTopologyCategories.Compute,
                Properties = new Dictionary<string, string> { ["resourceId"] = vmResourceId }
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = vmResourceId,
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "t1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_endpoints_keyed_by_terraform_tf_id_property()
    {
        const string appResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app-tf";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "obj-app",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "azurerm_linux_web_app.app",
                SourceId = "decl-tf-show-json-1",
                Category = GraphTopologyCategories.Compute,
                Properties = new Dictionary<string, string> { ["tf.id"] = appResourceId }
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = appResourceId,
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "obj-app" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_endpoints_keyed_by_terraform_tf_resource_id_property()
    {
        const string appResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app-tf-resource";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "obj-app",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "azurerm_linux_web_app.app",
                SourceId = "decl-tf-show-json-1",
                Category = GraphTopologyCategories.Compute,
                Properties = new Dictionary<string, string> { ["tf.resource_id"] = appResourceId }
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = appResourceId,
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "obj-app" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_endpoints_keyed_by_synthetic_service_node_id()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "t1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "svc-api",
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "t1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_storage_category_nodes_by_synthetic_datastore_node_id()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "t1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "blob-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "artifacts",
                Category = GraphTopologyCategories.Storage,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "api",
                    TargetId = "ds-artifacts",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "t1" &&
            e.ToNodeId == "blob-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_keeps_synthetic_service_and_datastore_aliases_distinct_when_labels_match()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-orders",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "orders",
                Category = GraphTopologyCategories.Compute,
                SourceType = "Terraform",
                SourceId = "azurerm_app_service.orders",
                Properties = new()
            },
            new()
            {
                NodeId = "ds-orders",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "orders",
                Category = GraphTopologyCategories.Data,
                SourceType = "Terraform",
                SourceId = "azurerm_storage_account.orders",
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "svc-orders",
                    TargetId = "ds-orders",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-orders" &&
            e.ToNodeId == "ds-orders" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_arm_source_id_with_surrounding_whitespace()
    {
        const string rawArmId =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Web/sites/api-app";
        const string paddedArmId = $"  {rawArmId}  ";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new Dictionary<string, string> { ["resourceId"] = rawArmId }
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = paddedArmId,
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_terraform_source_id_when_graph_source_id_has_surrounding_whitespace()
    {
        const string rawTerraformSourceId = "azurerm_app_service.main";
        const string paddedTerraformSourceId = $"  {rawTerraformSourceId}  ";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                SourceType = "Terraform",
                SourceId = paddedTerraformSourceId,
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                SourceType = "Terraform",
                SourceId = "azurerm_mssql_server.main",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = rawTerraformSourceId,
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_synthetic_datastore_id_when_graph_node_category_is_missing()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                SourceType = "Terraform",
                SourceId = "azurerm_mssql_server.main",
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "api",
                    TargetId = "ds-sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_synthetic_datastore_id_when_graph_node_has_compute_category_but_terraform_datastore_source_id()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Compute,
                SourceType = "Terraform",
                SourceId = "azurerm_mssql_server.main",
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "api",
                    TargetId = "ds-sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_synthetic_service_id_when_graph_node_has_data_category_but_terraform_service_source_id()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Data,
                SourceType = "Terraform",
                SourceId = "azurerm_app_service.main",
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                SourceType = "Terraform",
                SourceId = "azurerm_mssql_server.main",
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "svc-api",
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_endpoints_when_declared_alias_key_has_surrounding_whitespace()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        Dictionary<string, string> endpointAliases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["  api  "] = "svc-1",
        };

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "api",
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ],
            endpointAliases);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_when_endpoint_alias_maps_renamed_service_label_to_node_with_tf_id_property_only()
    {
        const string appArmId =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api-app";
        const string sqlArmId =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/sql-srv";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new Dictionary<string, string> { ["tf.id"] = appArmId }
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new Dictionary<string, string> { ["tf.resource_id"] = sqlArmId }
            }
        ];

        Dictionary<string, string> endpointAliases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["renamed-api"] = "svc-1",
        };

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "renamed-api",
                    TargetId = sqlArmId,
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ],
            endpointAliases);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_when_endpoint_alias_maps_renamed_datastore_label_to_node_with_tf_resource_id_property_only()
    {
        const string appArmId =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api-app";
        const string sqlArmId =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/sql-srv";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new Dictionary<string, string> { ["tf.id"] = appArmId }
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new Dictionary<string, string> { ["tf.resource_id"] = sqlArmId }
            }
        ];

        Dictionary<string, string> endpointAliases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["renamed-sql"] = "ds-1",
        };

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = appArmId,
                    TargetId = "renamed-sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ],
            endpointAliases);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_when_endpoint_aliases_map_renamed_service_and_datastore_labels_on_tf_property_only_nodes()
    {
        const string appArmId =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api-app";
        const string sqlArmId =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/sql-srv";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new Dictionary<string, string> { ["tf.id"] = appArmId }
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new Dictionary<string, string> { ["tf.resource_id"] = sqlArmId }
            }
        ];

        Dictionary<string, string> endpointAliases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["renamed-api"] = "svc-1",
            ["renamed-sql"] = "ds-1",
        };

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "renamed-api",
                    TargetId = "renamed-sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ],
            endpointAliases);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_endpoints_when_declared_alias_value_has_surrounding_whitespace()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        Dictionary<string, string> endpointAliases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["billing-api"] = "  svc-1  ",
        };

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "billing-api",
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ],
            endpointAliases);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_synthetic_service_id_when_graph_node_label_has_surrounding_whitespace()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "  api  ",
                Category = GraphTopologyCategories.Data,
                SourceType = "Terraform",
                SourceId = "azurerm_app_service.main",
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                SourceType = "Terraform",
                SourceId = "azurerm_mssql_server.main",
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "svc-api",
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_synthetic_alias_key_when_declared_alias_has_internal_whitespace_after_prefix()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "billing-api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        Dictionary<string, string> endpointAliases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["svc-  api"] = "svc-1",
        };

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "svc-api",
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ],
            endpointAliases);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_synthetic_service_id_when_relationship_endpoint_has_internal_whitespace_after_prefix()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "svc-  api",
                    TargetId = "ds-  sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_declared_alias_when_alias_value_is_mixed_case_arm_resource_id()
    {
        const string canonicalArmId =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api-app";
        const string mixedCaseArmId =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Web/sites/api-app";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new Dictionary<string, string> { ["resourceId"] = canonicalArmId }
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        Dictionary<string, string> endpointAliases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["billing-api"] = mixedCaseArmId,
        };

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "billing-api",
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ],
            endpointAliases);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_endpoints_when_declared_alias_value_has_internal_whitespace_after_synthetic_prefix()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        Dictionary<string, string> endpointAliases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["billing-api"] = "svc-  1",
        };

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "billing-api",
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ],
            endpointAliases);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_returns_empty_when_relationship_list_is_empty()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(nodes, []);

        edges.Should().BeEmpty();
    }

    [Fact]
    public void MapRelationships_skips_relationship_when_source_endpoint_is_unresolved()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [new ManifestRelationship { SourceId = "missing-api", TargetId = "ds-1", RelationshipType = RelationshipType.ReadsFrom }]);

        edges.Should().BeEmpty();
    }

    [Fact]
    public void MapRelationships_skips_relationship_when_target_endpoint_is_unresolved()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [new ManifestRelationship { SourceId = "svc-1", TargetId = "missing-sql", RelationshipType = RelationshipType.ReadsFrom }]);

        edges.Should().BeEmpty();
    }

    [Fact]
    public void MapRelationships_sets_inference_source_to_agent_proposal_relationship()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [new ManifestRelationship { SourceId = "svc-1", TargetId = "ds-1", RelationshipType = RelationshipType.ReadsFrom }]);

        edges.Should().ContainSingle(e => e.InferenceSource == GraphEdgeInferenceSources.AgentProposalRelationship);
    }

    [Fact]
    public void MapRelationships_skips_relationship_when_source_or_target_endpoint_is_blank()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> blankSource = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [new ManifestRelationship { SourceId = "   ", TargetId = "ds-1", RelationshipType = RelationshipType.ReadsFrom }]);

        IReadOnlyList<GraphEdge> blankTarget = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [new ManifestRelationship { SourceId = "svc-1", TargetId = "   ", RelationshipType = RelationshipType.ReadsFrom }]);

        blankSource.Should().BeEmpty();
        blankTarget.Should().BeEmpty();
    }

    [Fact]
    public void MapRelationships_sets_edge_label_to_manifest_relationship_type_name()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [new ManifestRelationship { SourceId = "svc-1", TargetId = "ds-1", RelationshipType = RelationshipType.ReadsFrom }]);

        edges.Should().ContainSingle(e => e.Label == nameof(RelationshipType.ReadsFrom));
    }

    [Fact]
    public void MapRelationships_ignores_blank_endpoint_alias_entries()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        Dictionary<string, string> endpointAliases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["   "] = "svc-1",
            ["api"] = "   ",
        };

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [new ManifestRelationship { SourceId = "api", TargetId = "sql", RelationshipType = RelationshipType.ReadsFrom }],
            endpointAliases);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_throws_when_topology_nodes_or_relationships_are_null()
    {
        List<GraphNode> nodes = [];
        List<ManifestRelationship> relationships = [];

        Action actNodes = () => TopologyProposalRelationshipEdgeMapper.MapRelationships(null!, relationships);
        Action actRelationships = () => TopologyProposalRelationshipEdgeMapper.MapRelationships(nodes, null!);

        actNodes.Should().Throw<ArgumentNullException>().WithParameterName("topologyNodes");
        actRelationships.Should().Throw<ArgumentNullException>().WithParameterName("relationships");
    }

    [Fact]
    public void MapRelationships_does_not_override_graph_resolution_with_conflicting_endpoint_alias()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        Dictionary<string, string> endpointAliases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["api"] = "svc-wrong",
        };

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [new ManifestRelationship { SourceId = "api", TargetId = "sql", RelationshipType = RelationshipType.ReadsFrom }],
            endpointAliases);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_assigns_unit_weight_and_deterministic_edge_id()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [new ManifestRelationship { SourceId = "svc-1", TargetId = "ds-1", RelationshipType = RelationshipType.ReadsFrom }]);

        edges.Should().ContainSingle(e =>
            e.Weight == 1d
            && e.EdgeId == $"agent-rel-svc-1-ds-1-{GraphEdgeTypes.ConnectsTo}");
    }

    [Fact]
    public void MapRelationships_emits_parallel_edges_when_proposal_lists_identical_relationship_twice()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        ManifestRelationship relationship = new()
        {
            SourceId = "svc-1",
            TargetId = "ds-1",
            RelationshipType = RelationshipType.ReadsFrom
        };

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [relationship, relationship]);

        edges.Should().HaveCount(2);
        edges.Should().OnlyContain(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "ds-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_emits_self_loop_edge_when_source_and_target_resolve_to_same_node()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [new ManifestRelationship { SourceId = "api", TargetId = "svc-1", RelationshipType = RelationshipType.ReadsFrom }]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "svc-1" &&
            e.ToNodeId == "svc-1" &&
            e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_resolves_endpoints_when_endpoint_aliases_argument_is_null()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [new ManifestRelationship { SourceId = "api", TargetId = "sql", RelationshipType = RelationshipType.ReadsFrom }],
            endpointAliases: null);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_maps_PublishesTo_and_SubscribesTo_to_ConnectsTo_edges()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "queue",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> publish = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [new ManifestRelationship { SourceId = "svc-1", TargetId = "ds-1", RelationshipType = RelationshipType.PublishesTo }]);

        IReadOnlyList<GraphEdge> subscribe = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [new ManifestRelationship { SourceId = "svc-1", TargetId = "ds-1", RelationshipType = RelationshipType.SubscribesTo }]);

        publish.Should().ContainSingle(e => e.EdgeType == GraphEdgeTypes.ConnectsTo);
        subscribe.Should().ContainSingle(e => e.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void MapRelationships_emits_one_edge_per_relationship_row_without_deduplicating()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        ManifestRelationship relationship = new()
        {
            SourceId = "svc-1",
            TargetId = "ds-1",
            RelationshipType = RelationshipType.ReadsFrom
        };

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [relationship, relationship]);

        edges.Should().HaveCount(2);
    }

    [Fact]
    public void MapRelationships_resolves_endpoint_when_relationship_uses_graph_node_source_id()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                SourceId = "azurerm_linux_web_app.app",
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "azurerm_linux_web_app.app",
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_target_when_relationship_uses_graph_node_source_id_for_datastore()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                SourceId = "azurerm_mssql_database.orders",
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "api",
                    TargetId = "azurerm_mssql_database.orders",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_returns_empty_when_topology_nodes_list_is_empty()
    {
        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            [],
            [new ManifestRelationship { SourceId = "svc-1", TargetId = "ds-1", RelationshipType = RelationshipType.ReadsFrom }]);

        edges.Should().BeEmpty();
    }

    [Fact]
    public void MapRelationships_resolves_source_via_ds_synthetic_fallback_on_compute_node_with_datastore_terraform_source()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-orders",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "orders",
                Category = GraphTopologyCategories.Compute,
                SourceId = "azurerm_mssql_database.orders",
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "ds-orders",
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-orders" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_source_via_svc_synthetic_fallback_on_data_node_with_service_terraform_source()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "ds-app",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "app",
                Category = GraphTopologyCategories.Data,
                SourceId = "azurerm_linux_web_app.app",
                Properties = new()
            },
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "svc-app",
                    TargetId = "api",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "ds-app" && e.ToNodeId == "svc-1");
    }

    [Fact]
    public void MapRelationships_resolves_synthetic_endpoint_when_relationship_uses_mixed_case_prefix()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "SVC-api",
                    TargetId = "DS-sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_relationship_when_endpoint_alias_key_uses_mixed_case_synthetic_prefix()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        Dictionary<string, string> endpointAliases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Svc-api"] = "svc-1",
        };

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "Svc-api",
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ],
            endpointAliases);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_relationship_when_endpoint_alias_value_uses_mixed_case_synthetic_prefix()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        Dictionary<string, string> endpointAliases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["legacy-api"] = "Svc-api",
        };

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "legacy-api",
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ],
            endpointAliases);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_target_when_relationship_uses_mixed_case_datastore_synthetic_prefix()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "api",
                    TargetId = "DS-sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_source_when_relationship_uses_mixed_case_service_synthetic_prefix()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "SVC-api",
                    TargetId = "ds-1",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_endpoints_when_relationship_uses_manifest_labels_instead_of_node_ids()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "api",
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_does_not_resolve_datastore_when_target_uses_mixed_case_service_synthetic_prefix()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "svc-1",
                    TargetId = "SVC-sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().BeEmpty();
    }

    [Fact]
    public void MapRelationships_does_not_resolve_service_when_source_uses_mixed_case_datastore_synthetic_prefix()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "DS-api",
                    TargetId = "ds-1",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().BeEmpty();
    }

    [Fact]
    public void MapRelationships_resolves_target_when_relationship_uses_lowercase_ds_synthetic_prefix_on_uppercase_label()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "API",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "SQL",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "API",
                    TargetId = "ds-SQL",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_source_when_relationship_uses_lowercase_svc_synthetic_prefix_on_uppercase_label()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "API",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "SQL",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "svc-API",
                    TargetId = "ds-1",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_endpoints_when_relationship_uses_lowercase_synthetic_prefixes_on_uppercase_labels()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "API",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "SQL",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "svc-API",
                    TargetId = "ds-SQL",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_endpoints_when_relationship_uses_uppercase_manifest_labels()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "API",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "SQL",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "API",
                    TargetId = "SQL",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_endpoints_when_relationship_uses_uppercase_mixed_case_synthetic_prefixes_on_uppercase_labels()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "API",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "SQL",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "SVC-API",
                    TargetId = "DS-SQL",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_endpoints_when_relationship_uses_graph_node_ids_on_uppercase_label_nodes()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "API",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "SQL",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "svc-1",
                    TargetId = "ds-1",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_when_manifest_labels_differ_in_case_from_graph_labels()
    {
        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "API",
                    TargetId = "SQL",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_endpoints_when_relationship_uses_arm_resource_ids_from_graph_node_properties()
    {
        const string sourceArm =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api-app";
        const string targetArm =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/sql-srv";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new Dictionary<string, string> { ["resourceId"] = sourceArm }
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new Dictionary<string, string> { ["resourceId"] = targetArm }
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = sourceArm.ToUpperInvariant(),
                    TargetId = targetArm.ToUpperInvariant(),
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_endpoints_when_relationship_uses_graph_node_terraform_source_id_values()
    {
        const string serviceTerraformSourceId = "azurerm_linux_web_app.app";
        const string datastoreTerraformSourceId = "azurerm_mssql_database.db";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                SourceType = "Terraform",
                SourceId = serviceTerraformSourceId,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                SourceType = "Terraform",
                SourceId = datastoreTerraformSourceId,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = serviceTerraformSourceId,
                    TargetId = datastoreTerraformSourceId,
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_when_relationship_terraform_source_ids_differ_only_in_case_from_graph_source_id()
    {
        const string serviceTerraformSourceId = "azurerm_linux_web_app.app";
        const string datastoreTerraformSourceId = "azurerm_mssql_database.db";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                SourceType = "Terraform",
                SourceId = serviceTerraformSourceId,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                SourceType = "Terraform",
                SourceId = datastoreTerraformSourceId,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = serviceTerraformSourceId.ToUpperInvariant(),
                    TargetId = datastoreTerraformSourceId.ToUpperInvariant(),
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_endpoints_when_relationship_uses_arm_resource_ids_on_graph_node_source_id_fields()
    {
        const string sourceArm =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api-app";
        const string targetArm =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/sql-srv";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                SourceType = "ARM",
                SourceId = sourceArm,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                SourceType = "ARM",
                SourceId = targetArm,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = sourceArm,
                    TargetId = targetArm,
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_when_relationship_arm_resource_ids_on_graph_source_id_differ_only_in_case()
    {
        const string sourceArm =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api-app";
        const string targetArm =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/sql-srv";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                SourceType = "ARM",
                SourceId = sourceArm,
                Properties = new()
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                SourceType = "ARM",
                SourceId = targetArm,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = sourceArm.ToUpperInvariant(),
                    TargetId = targetArm.ToUpperInvariant(),
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_when_relationship_terraform_tf_id_differs_only_in_case_from_graph_property()
    {
        const string appResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app-tf";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "obj-app",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "azurerm_linux_web_app.app",
                SourceId = "decl-tf-show-json-1",
                Category = GraphTopologyCategories.Compute,
                Properties = new Dictionary<string, string> { ["tf.id"] = appResourceId }
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = appResourceId.ToUpperInvariant(),
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "obj-app" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_when_relationship_terraform_tf_resource_id_differs_only_in_case_from_graph_property()
    {
        const string appResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app-tf-resource";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "obj-app",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "azurerm_linux_web_app.app",
                SourceId = "decl-tf-show-json-2",
                Category = GraphTopologyCategories.Compute,
                Properties = new Dictionary<string, string> { ["tf.resource_id"] = appResourceId }
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = appResourceId.ToUpperInvariant(),
                    TargetId = "sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "obj-app" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_when_relationship_arm_resource_ids_on_graph_property_differ_only_in_case()
    {
        const string sourceArm =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api-app";
        const string targetArm =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/sql-srv";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new Dictionary<string, string> { ["resourceId"] = sourceArm }
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new Dictionary<string, string> { ["resourceId"] = targetArm }
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = sourceArm.ToUpperInvariant(),
                    TargetId = targetArm.ToUpperInvariant(),
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_when_relationship_arm_resource_ids_on_graph_tf_resource_id_property_differ_only_in_case()
    {
        const string sourceArm =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api-app";
        const string targetArm =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/sql-srv";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new Dictionary<string, string> { ["tf.resource_id"] = sourceArm }
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new Dictionary<string, string> { ["tf.resource_id"] = targetArm }
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = sourceArm.ToUpperInvariant(),
                    TargetId = targetArm.ToUpperInvariant(),
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_when_relationship_arm_resource_ids_match_mixed_tf_resource_id_source_and_tf_id_target_graph_properties()
    {
        const string sourceArm =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api-app";
        const string targetArm =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/sql-srv";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new Dictionary<string, string> { ["tf.resource_id"] = sourceArm }
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new Dictionary<string, string> { ["tf.id"] = targetArm }
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = sourceArm,
                    TargetId = targetArm,
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_when_relationship_arm_resource_ids_on_graph_tf_id_property_differ_only_in_case()
    {
        const string sourceArm =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api-app";
        const string targetArm =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/sql-srv";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new Dictionary<string, string> { ["tf.id"] = sourceArm }
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new Dictionary<string, string> { ["tf.id"] = targetArm }
            }
        ];

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = sourceArm.ToUpperInvariant(),
                    TargetId = targetArm.ToUpperInvariant(),
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ]);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_when_endpoint_alias_arm_value_differs_only_in_case_from_graph_tf_resource_id_property()
    {
        const string sourceArm =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api-app";
        const string targetArm =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/sql-srv";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new Dictionary<string, string> { ["tf.resource_id"] = sourceArm }
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new Dictionary<string, string> { ["tf.resource_id"] = targetArm }
            }
        ];

        Dictionary<string, string> endpointAliases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["billing-api"] = sourceArm.ToUpperInvariant(),
            ["billing-sql"] = targetArm.ToUpperInvariant(),
        };

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "billing-api",
                    TargetId = "billing-sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ],
            endpointAliases);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }

    [Fact]
    public void MapRelationships_resolves_when_endpoint_alias_arm_value_differs_only_in_case_from_graph_tf_id_property()
    {
        const string sourceArm =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api-app";
        const string targetArm =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/sql-srv";

        List<GraphNode> nodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new Dictionary<string, string> { ["tf.id"] = sourceArm }
            },
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new Dictionary<string, string> { ["tf.id"] = targetArm }
            }
        ];

        Dictionary<string, string> endpointAliases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["billing-api"] = sourceArm.ToUpperInvariant(),
            ["billing-sql"] = targetArm.ToUpperInvariant(),
        };

        IReadOnlyList<GraphEdge> edges = TopologyProposalRelationshipEdgeMapper.MapRelationships(
            nodes,
            [
                new ManifestRelationship
                {
                    SourceId = "billing-api",
                    TargetId = "billing-sql",
                    RelationshipType = RelationshipType.ReadsFrom
                }
            ],
            endpointAliases);

        edges.Should().ContainSingle(e => e.FromNodeId == "svc-1" && e.ToNodeId == "ds-1");
    }
}
