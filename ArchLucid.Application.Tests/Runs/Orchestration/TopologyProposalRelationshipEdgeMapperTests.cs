using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

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
}
