using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Diagram;
using ArchLucid.KnowledgeGraph.Inventory;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

/// <summary>
///     AS-050: bound inventory snapshot resources merge as ObservedFact graph nodes; unbound overlay is a no-op.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureInventoryObservedFactGraphOverlayTests
{
    private static readonly Guid SnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    private static readonly Guid CloudResourceId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid RunId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ContextSnapshotId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [Fact]
    public void BuildOverlay_boundFixture_emitsObservedFactNodesWithCloudResourceId()
    {
        AzureInventorySnapshotDetailReadModel snapshot = CreateSnapshotFixture();

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        GraphNode resourceNode = overlay.Nodes.Should().ContainSingle(node =>
            node.Properties.GetValueOrDefault("cloudResourceId") == CloudResourceId.ToString("D")).Subject;

        resourceNode.Properties[StructuredDiagramGraphPropertyKeys.ProvenanceKind]
            .Should().Be(StructuredDiagramGraphProvenanceKinds.ObservedFact);
        resourceNode.Properties["armResourceId"]
            .Should().Be(ArmResourceIdNormalizer.Normalize(
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/pay-sql-prod"));
        resourceNode.SourceType.Should().Be(ArchitectureInventoryGraphSourceTypes.AzureInventorySnapshot);
        resourceNode.NodeId.Should().Be(CloudResourceId.ToString("D"));
    }

    [Fact]
    public void BuildOverlay_mints_nodes_and_edges_without_padded_property_bag_keys()
    {
        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            CreateSnapshotFixture(),
            RunId,
            ContextSnapshotId);

        foreach (GraphNode node in overlay.Nodes)
        {
            foreach (string key in node.Properties.Keys)
            {
                key.Should().Be(key.Trim());
            }
        }

        foreach (GraphEdge edge in overlay.Edges)
        {
            foreach (string key in edge.Properties.Keys)
            {
                key.Should().Be(key.Trim());
            }
        }
    }

    [Fact]
    public void BuildOverlay_emits_single_canonical_provenance_kind_key_on_resource_nodes_and_edges()
    {
        const string fromResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-prod";
        const string toResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/subnets/subnet-prod";

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                CreatedUtc = new DateTime(2026, 7, 18, 12, 0, 0, DateTimeKind.Utc),
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("99999999-9999-9999-9999-999999999999"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = fromResourceId,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = toResourceId,
                    ResourceType = "Microsoft.Network/subnets",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
            ],
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = fromResourceId,
                    ToAzureResourceId = toResourceId,
                    RelationshipType = GraphEdgeTypes.ContainsResource,
                },
            ],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        foreach (GraphNode node in overlay.Nodes)
        {
            node.Properties.Keys
                .Count(key => string.Equals(
                    key.Trim(),
                    StructuredDiagramGraphPropertyKeys.ProvenanceKind,
                    StringComparison.OrdinalIgnoreCase))
                .Should()
                .Be(1);

            GraphNodePropertyReader.TryGetPropertyValue(
                    node.Properties,
                    StructuredDiagramGraphPropertyKeys.ProvenanceKind,
                    out string? provenanceKind)
                .Should()
                .BeTrue();
            provenanceKind.Should().Be(StructuredDiagramGraphProvenanceKinds.ObservedFact);
        }

        foreach (GraphEdge edge in overlay.Edges)
        {
            edge.Properties.Keys
                .Count(key => string.Equals(
                    key.Trim(),
                    StructuredDiagramGraphPropertyKeys.ProvenanceKind,
                    StringComparison.OrdinalIgnoreCase))
                .Should()
                .Be(1);

            GraphNodePropertyReader.TryGetPropertyValue(
                    edge.Properties,
                    StructuredDiagramGraphPropertyKeys.ProvenanceKind,
                    out string? provenanceKind)
                .Should()
                .BeTrue();
            provenanceKind.Should().Be(StructuredDiagramGraphProvenanceKinds.ObservedFact);
        }
    }

    [Fact]
    public void Merge_normalizes_padded_inventory_overlay_warnings_and_dedupes_trim_equal_entries()
    {
        const string sharedWarning = "inventory-overlay-warning";
        string paddedSharedWarning = $"  {sharedWarning}  ";
        const string overlayOnlyWarning = "overlay-only-warning";
        string paddedOverlayOnlyWarning = $"  {overlayOnlyWarning}  ";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-node",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "Context",
                },
            ],
            Edges = [],
            Warnings = [sharedWarning],
        };

        GraphSnapshot overlay = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = CloudResourceId.ToString("D"),
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                },
            ],
            Edges = [],
            Warnings = [paddedSharedWarning, paddedOverlayOnlyWarning],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Warnings.Should().Equal(sharedWarning, overlayOnlyWarning);
    }

    [Fact]
    public void Merge_deduplicates_overlay_warnings_when_base_and_overlay_messages_differ_only_by_casing()
    {
        const string sharedWarning = "inventory-overlay-warning";
        const string overlayOnlyWarning = "overlay-only-warning";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-node",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "Context",
                },
            ],
            Edges = [],
            Warnings = [sharedWarning],
        };

        GraphSnapshot overlay = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = CloudResourceId.ToString("D"),
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                },
            ],
            Edges = [],
            Warnings = ["INVENTORY-OVERLAY-WARNING", overlayOnlyWarning],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Warnings.Should().Equal(sharedWarning, overlayOnlyWarning);
    }

    [Fact]
    public void Merge_normalizes_base_warnings_when_overlay_warning_list_is_empty()
    {
        const string warning = "base-warning-only";
        string paddedDuplicate = $"  {warning}  ";
        string caseVariantDuplicate = "BASE-WARNING-ONLY";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-node",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "Context",
                },
            ],
            Edges = [],
            Warnings = [warning, paddedDuplicate, caseVariantDuplicate],
        };

        GraphSnapshot overlayWithNodesOnly = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = CloudResourceId.ToString("D"),
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                },
            ],
            Edges = [],
            Warnings = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(
            baseGraph,
            overlayWithNodesOnly);

        merged.Warnings.Should().ContainSingle().Which.Should().Be(warning);
    }

    [Fact]
    public void Merge_appends_inventory_overlay_warnings_when_overlay_has_no_nodes_or_edges()
    {
        const string overlayWarning = "inventory-overlay-warning-only";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-node",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "Context",
                },
            ],
            Edges = [],
            Warnings = ["base-warning"],
        };

        GraphSnapshot warningsOnlyOverlay = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes = [],
            Edges = [],
            Warnings = [overlayWarning],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, warningsOnlyOverlay);

        merged.Nodes.Should().HaveCount(1);
        merged.Edges.Should().BeEmpty();
        merged.Warnings.Should().Equal("base-warning", overlayWarning);
    }

    [Fact]
    public void Merge_unboundOverlay_leavesBaseGraphUnchanged()
    {
        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-node",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "Context",
                },
            ],
            Edges = [],
        };

        GraphSnapshot emptyOverlay = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes = [],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, emptyOverlay);

        merged.Nodes.Should().HaveCount(1);
        merged.Nodes[0].NodeId.Should().Be("context-node");
    }

    [Fact]
    public void Merge_normalizes_padded_property_keys_when_appending_new_inventory_overlay_node()
    {
        string canonicalNodeId = CloudResourceId.ToString("D");
        const string PaddedCloudResourceIdKey = "  cloudResourceId  ";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-node",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "Context",
                },
            ],
            Edges = [],
        };

        GraphSnapshot overlay = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        [PaddedCloudResourceIdKey] = canonicalNodeId,
                    },
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        GraphNode? inventoryNode = merged.Nodes.SingleOrDefault(node => node.NodeId == canonicalNodeId);
        inventoryNode.Should().NotBeNull();
        inventoryNode!.Properties.Should().ContainKey("cloudResourceId");
        inventoryNode.Properties["cloudResourceId"].Should().Be(canonicalNodeId);
        inventoryNode.Properties.Should().NotContainKey(PaddedCloudResourceIdKey);
    }

    [Fact]
    public void Merge_normalizes_padded_node_id_when_appending_new_inventory_overlay_node()
    {
        string canonicalNodeId = CloudResourceId.ToString("D");

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-node",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "Context",
                },
            ],
            Edges = [],
        };

        GraphSnapshot overlay = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = $"  {canonicalNodeId}  ",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        ["cloudResourceId"] = canonicalNodeId,
                    },
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Should().Contain(node => node.NodeId == canonicalNodeId);
        merged.Nodes.Should().NotContain(node => node.NodeId != canonicalNodeId && node.NodeId.Trim() == canonicalNodeId);
    }

    [Fact]
    public void Merge_boundOverlay_skips_inventory_node_when_node_id_differs_only_by_surrounding_whitespace()
    {
        string canonicalNodeId = CloudResourceId.ToString("D");

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-node",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "Context",
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                },
            ],
            Edges = [],
        };

        GraphSnapshot overlay = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = $"  {canonicalNodeId}  ",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL duplicate",
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Should().Contain(node => node.NodeId == canonicalNodeId);
    }

    [Fact]
    public void Merge_appends_inventory_overlay_edge_when_endpoints_have_surrounding_whitespace_matching_base_nodes()
    {
        const string NodeA = "node-a";
        const string NodeB = "node-b";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode { NodeId = NodeA, NodeType = GraphNodeTypes.TopologyResource, Label = "A" },
                new GraphNode { NodeId = NodeB, NodeType = GraphNodeTypes.TopologyResource, Label = "B" },
            ],
            Edges = [],
        };

        GraphSnapshot overlay = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode { NodeId = $"  {NodeA}  ", NodeType = GraphNodeTypes.TopologyResource, Label = "A dup" },
                new GraphNode { NodeId = $"  {NodeB}  ", NodeType = GraphNodeTypes.TopologyResource, Label = "B dup" },
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "overlay-edge",
                    FromNodeId = $"  {NodeA}  ",
                    ToNodeId = $"  {NodeB}  ",
                    EdgeType = GraphEdgeTypes.ContainsResource,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().HaveCount(2);
        merged.Edges.Should().ContainSingle(edge =>
            edge.FromNodeId == NodeA
            && edge.ToNodeId == NodeB
            && edge.EdgeType == GraphEdgeTypes.ContainsResource);
    }

    [Fact]
    public void Merge_skips_inventory_edge_when_directed_key_differs_only_by_edge_type_padding()
    {
        const string fromNodeId = "node-a";
        const string toNodeId = "node-b";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode { NodeId = fromNodeId, NodeType = GraphNodeTypes.TopologyResource, Label = "A" },
                new GraphNode { NodeId = toNodeId, NodeType = GraphNodeTypes.TopologyResource, Label = "B" },
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge",
                    FromNodeId = fromNodeId,
                    ToNodeId = toNodeId,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                },
            ],
        };

        GraphSnapshot overlay = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "overlay-edge",
                    FromNodeId = fromNodeId,
                    ToNodeId = toNodeId,
                    EdgeType = $"  {GraphEdgeTypes.ConnectsTo}  ",
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle();
    }

    [Fact]
    public void BuildOverlay_stamps_trimmed_label_from_arm_name_segment_when_name_has_surrounding_whitespace()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/  vnet-prod  ";

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                CreatedUtc = new DateTime(2026, 7, 18, 12, 0, 0, DateTimeKind.Utc),
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armId,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
            ],
            Relationships = [],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        overlay.Nodes.Should().ContainSingle().Which.Label.Should().Be("vnet-prod");
    }

    [Fact]
    public void BuildOverlay_stamps_trimmed_resource_type_on_arm_type_and_resolves_topology_category()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-prod";
        const string paddedResourceType = "  Microsoft.Network/virtualNetworks  ";

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                CreatedUtc = new DateTime(2026, 7, 18, 12, 0, 0, DateTimeKind.Utc),
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armId,
                    ResourceType = paddedResourceType,
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
            ],
            Relationships = [],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        GraphNode node = overlay.Nodes.Should().ContainSingle().Subject;
        node.Properties["arm.type"].Should().Be("Microsoft.Network/virtualNetworks");
        node.Category.Should().Be(GraphTopologyCategories.Network);
    }

    [Fact]
    public void BuildOverlay_stamps_trimmed_resource_group_and_subscription_id_on_minted_nodes()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-prod";

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                CreatedUtc = new DateTime(2026, 7, 18, 12, 0, 0, DateTimeKind.Utc),
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armId,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "  rg  ",
                    SubscriptionId = "  sub  ",
                },
            ],
            Relationships = [],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        GraphNode node = overlay.Nodes.Should().ContainSingle().Subject;
        node.Properties["arm.resourceGroup"].Should().Be("rg");
        node.Properties["arm.subscriptionId"].Should().Be("sub");
    }

    [Fact]
    public void BuildOverlay_stamps_normalized_arm_citations_when_winning_resource_row_has_surrounding_whitespace_on_azure_resource_id()
    {
        const string armIdCanonical =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-prod";
        string paddedArmId = $"  {armIdCanonical}  ";
        string expectedCitation = ArmResourceIdNormalizer.Normalize(armIdCanonical);

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                CreatedUtc = new DateTime(2026, 7, 18, 12, 0, 0, DateTimeKind.Utc),
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("66666666-6666-6666-6666-666666666666"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = paddedArmId,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdCanonical,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
            ],
            Relationships = [],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        GraphNode node = overlay.Nodes.Should().ContainSingle().Subject;
        node.SourceId.Should().Be(expectedCitation);
        node.Properties["arm.id"].Should().Be(expectedCitation);
        node.Properties["armResourceId"].Should().Be(expectedCitation);
        node.Properties["azureResourceId"].Should().Be(expectedCitation);
    }

    [Fact]
    public void BuildOverlay_deduplicates_resources_when_arm_id_differs_only_by_surrounding_whitespace()
    {
        const string armIdCanonical =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-prod";

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                CreatedUtc = new DateTime(2026, 7, 18, 12, 0, 0, DateTimeKind.Utc),
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdCanonical,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("66666666-6666-6666-6666-666666666666"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = $"  {armIdCanonical}  ",
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
            ],
            Relationships = [],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        overlay.Nodes.Should().ContainSingle();
        ArmResourceIdNormalizer.Normalize(overlay.Nodes[0].Properties["armResourceId"])
            .Should().Be(ArmResourceIdNormalizer.Normalize(armIdCanonical));
    }

    [Fact]
    public void BuildOverlay_deduplicates_resources_when_arm_id_differs_only_by_case()
    {
        const string armIdLower =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-prod";
        const string armIdUpper =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Network/virtualNetworks/VNET-PROD";

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                CreatedUtc = new DateTime(2026, 7, 18, 12, 0, 0, DateTimeKind.Utc),
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdLower,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("66666666-6666-6666-6666-666666666666"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdUpper,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
            ],
            Relationships = [],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        overlay.Nodes.Should().ContainSingle();
        ArmResourceIdNormalizer.Normalize(overlay.Nodes[0].Properties["armResourceId"])
            .Should().Be(ArmResourceIdNormalizer.Normalize(armIdLower));
    }

    [Fact]
    public void BuildOverlay_matches_relationship_endpoints_when_arm_id_differs_only_by_surrounding_whitespace()
    {
        const string fromResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-prod";
        const string toResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/subnets/subnet-prod";

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                CreatedUtc = new DateTime(2026, 7, 18, 12, 0, 0, DateTimeKind.Utc),
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("77777777-7777-7777-7777-777777777777"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = fromResourceId,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("88888888-8888-8888-8888-888888888888"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = toResourceId,
                    ResourceType = "Microsoft.Network/subnets",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
            ],
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = $"  {fromResourceId}  ",
                    ToAzureResourceId = $"  {toResourceId}  ",
                    RelationshipType = GraphEdgeTypes.ContainsResource,
                },
            ],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        overlay.Edges.Should().ContainSingle();
        overlay.Edges[0].EdgeType.Should().Be(GraphEdgeTypes.ContainsResource);
    }

    [Fact]
    public void BuildOverlay_matches_relationship_endpoints_when_arm_id_differs_only_by_case()
    {
        const string resourceIdUpper =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Network/virtualNetworks/VNET-PROD/";
        const string resourceIdLower =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/subnets/SUBNET-PROD";

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                CreatedUtc = new DateTime(2026, 7, 18, 12, 0, 0, DateTimeKind.Utc),
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("77777777-7777-7777-7777-777777777777"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = resourceIdUpper,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "RG",
                    SubscriptionId = "SUB",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("88888888-8888-8888-8888-888888888888"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = resourceIdLower,
                    ResourceType = "Microsoft.Network/subnets",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
            ],
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = resourceIdUpper.TrimEnd('/').ToLowerInvariant(),
                    ToAzureResourceId = resourceIdLower,
                    RelationshipType = GraphEdgeTypes.ContainsResource,
                },
            ],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        overlay.Edges.Should().ContainSingle();
        overlay.Edges[0].EdgeType.Should().Be(GraphEdgeTypes.ContainsResource);
    }

    [Fact]
    public void BuildOverlay_deduplicates_relationships_when_relationship_type_differs_only_by_surrounding_whitespace()
    {
        const string fromResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-prod";
        const string toResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/subnets/subnet-prod";

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                CreatedUtc = new DateTime(2026, 7, 18, 12, 0, 0, DateTimeKind.Utc),
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("99999999-9999-9999-9999-999999999999"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = fromResourceId,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = toResourceId,
                    ResourceType = "Microsoft.Network/subnets",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
            ],
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = fromResourceId,
                    ToAzureResourceId = toResourceId,
                    RelationshipType = GraphEdgeTypes.ContainsResource,
                },
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = fromResourceId,
                    ToAzureResourceId = toResourceId,
                    RelationshipType = $"  {GraphEdgeTypes.ContainsResource}  ",
                },
            ],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        overlay.Edges.Should().ContainSingle();
        overlay.Edges[0].EdgeType.Should().Be(GraphEdgeTypes.ContainsResource);
    }

    [Fact]
    public void BuildOverlay_deduplicates_relationships_when_relationship_type_differs_only_by_case()
    {
        const string fromResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-prod";
        const string toResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/subnets/subnet-prod";

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                CreatedUtc = new DateTime(2026, 7, 18, 12, 0, 0, DateTimeKind.Utc),
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("99999999-9999-9999-9999-999999999999"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = fromResourceId,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = toResourceId,
                    ResourceType = "Microsoft.Network/subnets",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
            ],
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = fromResourceId,
                    ToAzureResourceId = toResourceId,
                    RelationshipType = GraphEdgeTypes.ContainsResource,
                },
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = fromResourceId,
                    ToAzureResourceId = toResourceId,
                    RelationshipType = GraphEdgeTypes.ContainsResource.ToLowerInvariant(),
                },
            ],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        overlay.Edges.Should().ContainSingle();
    }

    [Fact]
    public void Merge_deduplicates_parallel_edges_when_edge_type_differs_only_by_surrounding_whitespace()
    {
        const string NodeA = "node-a";
        const string NodeB = "node-b";
        string paddedEdgeType = $"  {GraphEdgeTypes.ConnectsTo}  ";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = NodeA,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "A",
                },
                new GraphNode
                {
                    NodeId = NodeB,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "B",
                },
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                },
            ],
        };

        GraphSnapshot overlay = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "overlay-edge",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = paddedEdgeType,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle(edge =>
            edge.FromNodeId == NodeA
            && edge.ToNodeId == NodeB
            && edge.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void Merge_normalizes_padded_edge_endpoints_when_appending_inventory_overlay_edge()
    {
        const string NodeA = "node-a";
        const string NodeB = "node-b";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = NodeA,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "A",
                },
                new GraphNode
                {
                    NodeId = NodeB,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "B",
                },
            ],
            Edges = [],
        };

        GraphSnapshot overlay = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "overlay-edge",
                    FromNodeId = $"  {NodeA}  ",
                    ToNodeId = $"  {NodeB}  ",
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle(edge =>
            edge.FromNodeId == NodeA
            && edge.ToNodeId == NodeB
            && edge.EdgeType == GraphEdgeTypes.ConnectsTo);
    }

    [Fact]
    public void Merge_normalizes_padded_property_keys_when_appending_inventory_overlay_edge()
    {
        const string NodeA = "node-a";
        const string NodeB = "node-b";
        const string PaddedSourceEvidenceKey = "  sourceEvidenceItemId  ";
        const string SourceEvidenceId = "evidence-42";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode { NodeId = NodeA, NodeType = GraphNodeTypes.TopologyResource, Label = "A" },
                new GraphNode { NodeId = NodeB, NodeType = GraphNodeTypes.TopologyResource, Label = "B" },
            ],
            Edges = [],
        };

        GraphSnapshot overlay = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "overlay-edge",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        [PaddedSourceEvidenceKey] = SourceEvidenceId,
                    },
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        GraphEdge edge = merged.Edges.Should().ContainSingle().Subject;
        edge.Properties.Should().ContainKey("sourceEvidenceItemId");
        edge.Properties["sourceEvidenceItemId"].Should().Be(SourceEvidenceId);
        edge.Properties.Should().NotContainKey(PaddedSourceEvidenceKey);
    }

    [Fact]
    public void Merge_normalizes_padded_edge_type_when_appending_inventory_overlay_edge()
    {
        const string NodeA = "node-a";
        const string NodeB = "node-b";
        string paddedEdgeType = $"  {GraphEdgeTypes.ContainsResource}  ";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = NodeA,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "A",
                },
                new GraphNode
                {
                    NodeId = NodeB,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "B",
                },
            ],
            Edges = [],
        };

        GraphSnapshot overlay = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "overlay-edge",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = paddedEdgeType,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle(edge =>
            edge.FromNodeId == NodeA
            && edge.ToNodeId == NodeB
            && edge.EdgeType == GraphEdgeTypes.ContainsResource);
    }

    [Fact]
    public void Merge_boundOverlay_addsInventoryNodesWithoutReplacingExistingNodes()
    {
        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-node",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "Context",
                },
            ],
            Edges = [],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            CreateSnapshotFixture(),
            RunId,
            ContextSnapshotId);

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Should().Contain(node => node.NodeId == "context-node");
        merged.Nodes.Should().Contain(node =>
            node.Properties.GetValueOrDefault("cloudResourceId") == CloudResourceId.ToString("D"));
    }

    private static AzureInventorySnapshotDetailReadModel CreateSnapshotFixture()
    {
        return new AzureInventorySnapshotDetailReadModel
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                CreatedUtc = new DateTime(2026, 7, 18, 12, 0, 0, DateTimeKind.Utc),
                CapturedUtc = new DateTime(2026, 7, 18, 12, 0, 0, DateTimeKind.Utc),
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    CloudResourceId = CloudResourceId,
                    AzureResourceId =
                        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/pay-sql-prod",
                    ResourceType = "Microsoft.Sql/servers",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
            ],
            Relationships = [],
        };
    }
}
