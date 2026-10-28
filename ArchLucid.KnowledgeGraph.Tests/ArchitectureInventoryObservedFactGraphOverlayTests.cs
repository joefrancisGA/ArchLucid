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
    public void BuildOverlay_throws_when_inventory_snapshot_is_null()
    {
        Action act = () => ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            null!,
            RunId,
            ContextSnapshotId);

        act.Should().Throw<ArgumentNullException>().WithParameterName("snapshot");
    }

    [Fact]
    public void BuildOverlay_returns_empty_overlay_when_inventory_snapshot_has_no_resources_or_relationships()
    {
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                CreatedUtc = new DateTime(2026, 7, 18, 12, 0, 0, DateTimeKind.Utc),
            },
            Resources = [],
            Relationships = [],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        overlay.Nodes.Should().BeEmpty();
        overlay.Edges.Should().BeEmpty();
        overlay.RunId.Should().Be(RunId);
        overlay.ContextSnapshotId.Should().Be(ContextSnapshotId);
    }

    [Fact]
    public void BuildOverlay_skips_orphan_relationships_when_endpoint_resources_are_missing()
    {
        const string sqlResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/pay-sql-prod";
        const string missingTargetId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/missing-vnet";

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
                    ResourceRowId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    CloudResourceId = CloudResourceId,
                    AzureResourceId = sqlResourceId,
                    ResourceType = "Microsoft.Sql/servers",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
            ],
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = sqlResourceId,
                    ToAzureResourceId = missingTargetId,
                    RelationshipType = GraphEdgeTypes.ConnectsTo,
                },
            ],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        overlay.Nodes.Should().ContainSingle();
        overlay.Edges.Should().BeEmpty();
    }

    [Fact]
    public void BuildOverlay_skips_relationships_when_relationship_type_normalizes_to_empty()
    {
        const string fromArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-a";
        const string toArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-b";

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
                    ResourceRowId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = fromArmId,
                    ResourceType = "Microsoft.Sql/servers",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = toArmId,
                    ResourceType = "Microsoft.Sql/servers",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
            ],
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = fromArmId,
                    ToAzureResourceId = toArmId,
                    RelationshipType = "   ",
                },
            ],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        overlay.Nodes.Should().HaveCount(2);
        overlay.Edges.Should().BeEmpty();
    }

    [Fact]
    public void BuildOverlay_skips_relationships_when_relationship_type_is_null()
    {
        const string fromArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-a";
        const string toArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-b";

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
                    ResourceRowId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = fromArmId,
                    ResourceType = "Microsoft.Sql/servers",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = toArmId,
                    ResourceType = "Microsoft.Sql/servers",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
            ],
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = fromArmId,
                    ToAzureResourceId = toArmId,
                    RelationshipType = null!,
                },
            ],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        overlay.Nodes.Should().HaveCount(2);
        overlay.Edges.Should().BeEmpty();
    }

    [Fact]
    public void BuildOverlay_skips_relationships_when_relationship_type_is_empty_string()
    {
        const string fromArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-a";
        const string toArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-b";

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
                    ResourceRowId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = fromArmId,
                    ResourceType = "Microsoft.Sql/servers",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = toArmId,
                    ResourceType = "Microsoft.Sql/servers",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
            ],
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = fromArmId,
                    ToAzureResourceId = toArmId,
                    RelationshipType = string.Empty,
                },
            ],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        overlay.Nodes.Should().HaveCount(2);
        overlay.Edges.Should().BeEmpty();
    }

    [Fact]
    public void BuildOverlay_stamps_resource_type_label_when_arm_resource_id_ends_with_slash()
    {
        const string armIdWithTrailingSlash =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-a/";
        const string resourceType = "Microsoft.Sql/servers";

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
                    ResourceRowId = Guid.Parse("12121212-1212-1212-1212-121212121212"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdWithTrailingSlash,
                    ResourceType = resourceType,
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
        node.Label.Should().Be(resourceType);
        node.Properties["arm.id"].Should().Be(ArmResourceIdNormalizer.Normalize(armIdWithTrailingSlash));
    }

    [Fact]
    public void BuildOverlay_stamps_resource_type_label_when_final_arm_name_segment_is_whitespace_only()
    {
        const string resourceType = "Microsoft.Sql/servers";
        const string armIdWithWhitespaceNameSegment =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/   ";

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
                    ResourceRowId = Guid.Parse("13131313-1313-1313-1313-131313131313"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdWithWhitespaceNameSegment,
                    ResourceType = resourceType,
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
        node.Label.Should().Be(resourceType);
    }

    [Fact]
    public void BuildOverlay_stamps_resource_type_label_when_arm_resource_id_has_no_name_segment()
    {
        const string armIdWithoutSlash = "legacy-resource-name";
        const string resourceType = "Microsoft.Sql/servers";

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
                    ResourceRowId = Guid.Parse("14141414-1414-1414-1414-141414141414"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdWithoutSlash,
                    ResourceType = resourceType,
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
        node.Label.Should().Be(resourceType);
        node.Properties["arm.id"].Should().Be(ArmResourceIdNormalizer.Normalize(armIdWithoutSlash));
    }

    [Fact]
    public void BuildOverlay_stamps_trimmed_arm_id_label_when_resource_type_is_whitespace_only_and_arm_id_has_no_slash()
    {
        const string armIdWithoutSlash = "legacy-resource-name";

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
                    ResourceRowId = Guid.Parse("15151515-1515-1515-1515-151515151515"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdWithoutSlash,
                    ResourceType = "   ",
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
        node.Label.Should().Be(armIdWithoutSlash);
    }

    [Fact]
    public void BuildOverlay_returns_no_edges_when_relationships_exist_but_resources_list_is_empty()
    {
        const string fromResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/pay-sql-prod";
        const string toResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-prod";

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                CreatedUtc = new DateTime(2026, 7, 18, 12, 0, 0, DateTimeKind.Utc),
            },
            Resources = [],
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = fromResourceId,
                    ToAzureResourceId = toResourceId,
                    RelationshipType = GraphEdgeTypes.ConnectsTo,
                },
            ],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        overlay.Nodes.Should().BeEmpty();
        overlay.Edges.Should().BeEmpty();
    }

    [Fact]
    public void BuildOverlay_skips_resource_rows_when_azure_resource_id_normalizes_to_empty()
    {
        const string validArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/pay-sql-prod";

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
                    ResourceRowId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    CloudResourceId = CloudResourceId,
                    AzureResourceId = validArmId,
                    ResourceType = "Microsoft.Sql/servers",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = "   ",
                    ResourceType = "Microsoft.Sql/servers",
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
        overlay.Nodes[0].NodeId.Should().Be(CloudResourceId.ToString("D"));
    }

    [Fact]
    public void BuildOverlay_skips_cloud_resource_id_row_when_azure_resource_id_is_missing()
    {
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
                    CloudResourceId = CloudResourceId,
                    AzureResourceId = string.Empty,
                    ResourceType = "Microsoft.Sql/servers",
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

        overlay.Nodes.Should().BeEmpty();
        overlay.Edges.Should().BeEmpty();
    }

    [Fact]
    public void BuildOverlay_uses_cloud_resource_id_as_node_id_when_arm_resource_id_is_present()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/pay-sql-prod";

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
                    ResourceRowId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    CloudResourceId = CloudResourceId,
                    AzureResourceId = armId,
                    ResourceType = "Microsoft.Sql/servers",
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
        node.NodeId.Should().Be(CloudResourceId.ToString("D"));
        node.Properties["cloudResourceId"].Should().Be(CloudResourceId.ToString("D"));
        node.Properties["arm.id"].Should().Be(ArmResourceIdNormalizer.Normalize(armId));
    }

    [Fact]
    public void BuildOverlay_uses_hashed_node_id_when_cloud_resource_id_is_absent()
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
                    ResourceRowId = Guid.Parse("77777777-7777-7777-7777-777777777777"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    CloudResourceId = null,
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

        GraphNode node = overlay.Nodes.Should().ContainSingle().Subject;
        node.NodeId.Should().Be(ArchitectureInventoryGraphNodeIdResolver.ResolveFromArmResourceId(armId));
        node.NodeId.Should().StartWith("n_");
        node.NodeId.Should().NotContain("/");
    }

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
    public void Merge_throws_when_base_graph_is_null()
    {
        GraphSnapshot overlay = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes = [],
            Edges = [],
            Warnings = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(null!, overlay);

        act.Should().Throw<ArgumentNullException>().WithParameterName("baseGraph");
    }

    [Fact]
    public void Merge_throws_when_inventory_overlay_is_null()
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
            Warnings = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("inventoryOverlay");
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
    public void Merge_normalizes_base_warnings_when_inventory_overlay_is_fully_empty()
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

        GraphSnapshot emptyOverlay = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes = [],
            Edges = [],
            Warnings = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, emptyOverlay);

        merged.Warnings.Should().ContainSingle().Which.Should().Be(warning);
        merged.Nodes.Should().HaveCount(baseGraph.Nodes.Count);
    }

    [Fact]
    public void Merge_skips_whitespace_only_warnings_in_base_and_overlay_lists()
    {
        const string baseWarning = "base-warning";
        const string overlayWarning = "overlay-warning";

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
            Warnings = [baseWarning, "   ", "\t"],
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
            Warnings = ["  ", overlayWarning, string.Empty],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Warnings.Should().Equal(baseWarning, overlayWarning);
    }

    [Fact]
    public void Merge_skips_null_warning_entries_in_base_and_overlay_lists()
    {
        const string baseWarning = "base-warning";
        const string overlayWarning = "overlay-warning";

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
            Warnings = [baseWarning, null!],
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
            Warnings = [null!, overlayWarning],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Warnings.Should().Equal(baseWarning, overlayWarning);
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
    public void Merge_deduplicates_overlay_property_keys_differing_only_by_case_when_appending_inventory_node()
    {
        string canonicalNodeId = CloudResourceId.ToString("D");
        const string CanonicalPropertyKey = "cloudResourceId";
        const string CaseVariantPropertyKey = "CloudResourceId";

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
                        [CanonicalPropertyKey] = canonicalNodeId,
                        [CaseVariantPropertyKey] = canonicalNodeId,
                    },
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        GraphNode inventoryNode = merged.Nodes.Should().Contain(node => node.NodeId == canonicalNodeId).Subject;
        inventoryNode.Properties.Should().HaveCount(1);
        inventoryNode.Properties[CanonicalPropertyKey].Should().Be(canonicalNodeId);
        inventoryNode.Properties[CaseVariantPropertyKey].Should().Be(canonicalNodeId);
    }

    [Fact]
    public void Merge_throws_when_overlay_property_keys_differ_only_by_case_and_values_conflict()
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
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        ["cloudResourceId"] = canonicalNodeId,
                        ["CloudResourceId"] = "22222222-2222-2222-2222-222222222222",
                    },
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*duplicate keys that collide under ordinal case-insensitive comparison*");
    }

    [Fact]
    public void Merge_throws_when_overlay_property_keys_differ_only_by_padding_and_values_conflict()
    {
        string canonicalNodeId = CloudResourceId.ToString("D");
        const string CanonicalPropertyKey = "cloudResourceId";
        const string PaddedPropertyKey = "  cloudResourceId  ";

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
                        [CanonicalPropertyKey] = canonicalNodeId,
                        [PaddedPropertyKey] = "22222222-2222-2222-2222-222222222222",
                    },
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*duplicate keys that collide under ordinal case-insensitive comparison*");
    }

    [Fact]
    public void Merge_deduplicates_overlay_property_keys_differing_only_by_padding_when_appending_inventory_node()
    {
        string canonicalNodeId = CloudResourceId.ToString("D");
        const string CanonicalPropertyKey = "cloudResourceId";
        const string PaddedPropertyKey = "  cloudResourceId  ";

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
                        [CanonicalPropertyKey] = canonicalNodeId,
                        [PaddedPropertyKey] = canonicalNodeId,
                    },
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        GraphNode inventoryNode = merged.Nodes.Should().Contain(node => node.NodeId == canonicalNodeId).Subject;
        inventoryNode.Properties.Should().HaveCount(1);
        inventoryNode.Properties[CanonicalPropertyKey].Should().Be(canonicalNodeId);
        inventoryNode.Properties[PaddedPropertyKey.Trim()].Should().Be(canonicalNodeId);
    }

    [Fact]
    public void Merge_coalesces_overlay_property_values_differing_only_by_padding_when_property_keys_trim_equal()
    {
        string canonicalNodeId = CloudResourceId.ToString("D");
        const string CanonicalPropertyKey = "sourceEvidenceItemId";
        const string PaddedPropertyKey = "  sourceEvidenceItemId  ";
        const string CanonicalValue = "evidence-42";
        const string PaddedValue = "  evidence-42  ";

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
                        [CanonicalPropertyKey] = CanonicalValue,
                        [PaddedPropertyKey] = PaddedValue,
                    },
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        GraphNode inventoryNode = merged.Nodes.Should().Contain(node => node.NodeId == canonicalNodeId).Subject;
        inventoryNode.Properties.Should().HaveCount(1);
        inventoryNode.Properties[CanonicalPropertyKey].Should().Be(CanonicalValue);
    }

    [Fact]
    public void Merge_skips_whitespace_only_overlay_property_keys_when_appending_inventory_node()
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
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        [string.Empty] = "ignored-empty-key",
                        ["   "] = "ignored-whitespace-key",
                        ["cloudResourceId"] = canonicalNodeId,
                    },
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        GraphNode inventoryNode = merged.Nodes.Should().Contain(node => node.NodeId == canonicalNodeId).Subject;
        inventoryNode.Properties.Should().ContainSingle()
            .Which.Key.Should().Be("cloudResourceId");
        inventoryNode.Properties["cloudResourceId"].Should().Be(canonicalNodeId);
    }

    [Fact]
    public void Merge_skips_whitespace_only_overlay_property_values_when_appending_inventory_node()
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
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        ["cloudResourceId"] = "   ",
                    },
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        GraphNode inventoryNode = merged.Nodes.Should().Contain(node => node.NodeId == canonicalNodeId).Subject;
        inventoryNode.Properties.Should().BeEmpty();
    }

    [Fact]
    public void Merge_appends_inventory_overlay_node_when_properties_are_null()
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
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Properties = null!,
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        GraphNode inventoryNode = merged.Nodes.Should().Contain(node => node.NodeId == canonicalNodeId).Subject;
        inventoryNode.Properties.Should().BeEmpty();
    }

    [Fact]
    public void Merge_appends_inventory_overlay_node_when_property_bag_contains_only_whitespace_entries()
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
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        [string.Empty] = "   ",
                        ["   "] = string.Empty,
                        ["  \t  "] = "  ",
                    },
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        GraphNode inventoryNode = merged.Nodes.Should().Contain(node => node.NodeId == canonicalNodeId).Subject;
        inventoryNode.Label.Should().Be("SQL");
        inventoryNode.Properties.Should().BeEmpty();
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
    public void Merge_skips_inventory_node_when_base_node_id_has_surrounding_whitespace()
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
                    NodeId = $"  {canonicalNodeId}  ",
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
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL duplicate",
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Should().Contain(node => node.NodeId.Trim() == canonicalNodeId);
        merged.Nodes.Should().NotContain(node => node.NodeId == canonicalNodeId);
    }

    [Fact]
    public void Merge_skips_second_overlay_node_when_node_ids_differ_only_by_surrounding_whitespace()
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
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                },
                new GraphNode
                {
                    NodeId = $"  {canonicalNodeId}  ",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Should().ContainSingle(node => node.NodeId.Trim() == canonicalNodeId);
        merged.Nodes.Single(node => node.NodeId.Trim() == canonicalNodeId).Label.Should().Be("SQL");
    }

    [Fact]
    public void Merge_skips_second_overlay_node_when_node_ids_differ_only_by_case()
    {
        const string canonicalNodeId = "inventory-node-a";

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
                    Label = "inventory-node-a",
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId.ToUpperInvariant(),
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "INVENTORY-NODE-A",
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Should().ContainSingle(node =>
            string.Equals(node.NodeId, canonicalNodeId, StringComparison.OrdinalIgnoreCase));
        merged.Nodes.Single(node =>
                string.Equals(node.NodeId, canonicalNodeId, StringComparison.OrdinalIgnoreCase))
            .Label.Should().Be("inventory-node-a");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_label()
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
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL primary",
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL duplicate",
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on Label*");
    }

    [Fact]
    public void Merge_coalesces_overlay_duplicate_node_labels_when_labels_differ_only_by_casing()
    {
        const string canonicalNodeId = "inventory-node-label-case";

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
                    Label = "VNET-PROD",
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vnet-prod",
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Single(node => string.Equals(node.NodeId, canonicalNodeId, StringComparison.OrdinalIgnoreCase))
            .Label.Should().Be("VNET-PROD");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_category()
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
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Category = GraphTopologyCategories.Network,
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Category = GraphTopologyCategories.Compute,
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on Category*");
    }

    [Fact]
    public void Merge_coalesces_overlay_duplicate_node_categories_when_categories_differ_only_by_casing()
    {
        const string canonicalNodeId = "inventory-node-category-case";

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
                    Category = GraphTopologyCategories.Network,
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Category = GraphTopologyCategories.Network.ToUpperInvariant(),
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Single(node => string.Equals(node.NodeId, canonicalNodeId, StringComparison.OrdinalIgnoreCase))
            .Category.Should().Be(GraphTopologyCategories.Network);
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_node_type()
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
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.Actor,
                    Label = "SQL",
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on NodeType*");
    }

    [Fact]
    public void Merge_coalesces_overlay_duplicate_node_types_when_node_types_differ_only_by_casing()
    {
        const string canonicalNodeId = "inventory-node-type-case";

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
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource.ToUpperInvariant(),
                    Label = "SQL",
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Single(node => string.Equals(node.NodeId, canonicalNodeId, StringComparison.OrdinalIgnoreCase))
            .NodeType.Should().Be(GraphNodeTypes.TopologyResource);
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_source_id()
    {
        string canonicalNodeId = CloudResourceId.ToString("D");
        const string sourceIdPrimary =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a";
        const string sourceIdDuplicate =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b";

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
                    SourceId = sourceIdPrimary,
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceId = sourceIdDuplicate,
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on SourceId*");
    }

    [Fact]
    public void Merge_coalesces_overlay_duplicate_node_source_ids_when_source_ids_differ_only_by_casing()
    {
        const string canonicalNodeId = "inventory-node-source-id-case";
        const string sourceIdLower =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-prod";
        const string sourceIdUpper =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Network/virtualNetworks/VNET-PROD";

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
                    SourceId = sourceIdLower,
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceId = sourceIdUpper,
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Single(node => string.Equals(node.NodeId, canonicalNodeId, StringComparison.OrdinalIgnoreCase))
            .SourceId.Should().Be(sourceIdLower);
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_source_type()
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
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceType = ArchitectureInventoryGraphSourceTypes.AzureInventorySnapshot,
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceType = "other-source-type",
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on SourceType*");
    }

    [Fact]
    public void Merge_coalesces_overlay_duplicate_node_source_types_when_source_types_differ_only_by_casing()
    {
        const string canonicalNodeId = "inventory-node-source-type-case";

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
                    SourceType = ArchitectureInventoryGraphSourceTypes.AzureInventorySnapshot,
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceType = ArchitectureInventoryGraphSourceTypes.AzureInventorySnapshot.ToUpperInvariant(),
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Single(node => string.Equals(node.NodeId, canonicalNodeId, StringComparison.OrdinalIgnoreCase))
            .SourceType.Should().Be(ArchitectureInventoryGraphSourceTypes.AzureInventorySnapshot);
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_property_bag_value()
    {
        const string canonicalNodeId = "inventory-node-property-conflict";

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
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [StructuredDiagramGraphPropertyKeys.ProvenanceKind] =
                            StructuredDiagramGraphProvenanceKinds.ObservedFact,
                    },
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [StructuredDiagramGraphPropertyKeys.ProvenanceKind] =
                            StructuredDiagramGraphProvenanceKinds.DeterministicInference,
                    },
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on Properties*");
    }

    [Fact]
    public void Merge_coalesces_overlay_duplicate_node_property_values_when_property_values_differ_only_by_casing()
    {
        const string canonicalNodeId = "inventory-node-property-case";

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
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [StructuredDiagramGraphPropertyKeys.ProvenanceKind] =
                            StructuredDiagramGraphProvenanceKinds.ObservedFact.ToUpperInvariant(),
                    },
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [StructuredDiagramGraphPropertyKeys.ProvenanceKind] =
                            StructuredDiagramGraphProvenanceKinds.ObservedFact.ToLowerInvariant(),
                    },
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Single(node => string.Equals(node.NodeId, canonicalNodeId, StringComparison.OrdinalIgnoreCase))
            .Properties[StructuredDiagramGraphPropertyKeys.ProvenanceKind]
            .Should().Be(StructuredDiagramGraphProvenanceKinds.ObservedFact.ToUpperInvariant());
    }

    [Fact]
    public void Merge_backfills_overlay_duplicate_node_type_from_second_row_when_first_row_omits_node_type()
    {
        const string canonicalNodeId = "inventory-node-type-backfill";

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
                    NodeType = "   ",
                    Label = "SQL",
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

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Single(node => string.Equals(node.NodeId, canonicalNodeId, StringComparison.OrdinalIgnoreCase))
            .NodeType.Should().Be(GraphNodeTypes.TopologyResource);
    }

    [Fact]
    public void Merge_backfills_overlay_duplicate_node_reasoning_trace_from_second_row_when_first_row_omits_reasoning_trace()
    {
        const string canonicalNodeId = "inventory-node-reasoning-trace-backfill";

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
                    ReasoningTrace = "   ",
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    ReasoningTrace = "inventory snapshot resource",
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Single(node => string.Equals(node.NodeId, canonicalNodeId, StringComparison.OrdinalIgnoreCase))
            .ReasoningTrace.Should().Be("inventory snapshot resource");
    }

    [Fact]
    public void Merge_backfills_overlay_duplicate_node_source_type_from_second_row_when_first_row_omits_source_type()
    {
        const string canonicalNodeId = "inventory-node-source-type-backfill";

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
                    SourceType = "   ",
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceType = ArchitectureInventoryGraphSourceTypes.AzureInventorySnapshot,
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Single(node => string.Equals(node.NodeId, canonicalNodeId, StringComparison.OrdinalIgnoreCase))
            .SourceType.Should().Be(ArchitectureInventoryGraphSourceTypes.AzureInventorySnapshot);
    }

    [Fact]
    public void Merge_backfills_overlay_duplicate_node_source_id_from_second_row_when_first_row_omits_source_id()
    {
        const string canonicalNodeId = "inventory-node-source-id-backfill";
        const string sourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-primary";

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
                    SourceId = "   ",
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceId = sourceId,
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Single(node => string.Equals(node.NodeId, canonicalNodeId, StringComparison.OrdinalIgnoreCase))
            .SourceId.Should().Be(sourceId);
    }

    [Fact]
    public void Merge_backfills_overlay_duplicate_node_category_from_second_row_when_first_row_omits_category()
    {
        const string canonicalNodeId = "inventory-node-category-backfill";

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
                    Category = "   ",
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Category = GraphTopologyCategories.Compute,
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Single(node => string.Equals(node.NodeId, canonicalNodeId, StringComparison.OrdinalIgnoreCase))
            .Category.Should().Be(GraphTopologyCategories.Compute);
    }

    [Fact]
    public void Merge_backfills_overlay_duplicate_node_label_from_second_row_when_first_row_omits_label()
    {
        const string canonicalNodeId = "inventory-node-label-backfill";

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
                    Label = "   ",
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL primary",
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Single(node => string.Equals(node.NodeId, canonicalNodeId, StringComparison.OrdinalIgnoreCase))
            .Label.Should().Be("SQL primary");
    }

    [Fact]
    public void Merge_backfills_overlay_duplicate_node_properties_from_second_row_when_first_row_omits_property_key()
    {
        const string canonicalNodeId = "inventory-node-property-backfill";

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
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [StructuredDiagramGraphPropertyKeys.ProvenanceKind] =
                            StructuredDiagramGraphProvenanceKinds.ObservedFact,
                    },
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Single(node => string.Equals(node.NodeId, canonicalNodeId, StringComparison.OrdinalIgnoreCase))
            .Properties[StructuredDiagramGraphPropertyKeys.ProvenanceKind]
            .Should().Be(StructuredDiagramGraphProvenanceKinds.ObservedFact);
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_reasoning_trace()
    {
        const string canonicalNodeId = "inventory-node-reasoning-conflict";

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
                    ReasoningTrace = "inventory snapshot resource",
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    ReasoningTrace = "inventory rbac binding",
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on ReasoningTrace*");
    }

    [Fact]
    public void Merge_coalesces_overlay_duplicate_node_reasoning_traces_when_reasoning_traces_differ_only_by_casing()
    {
        const string canonicalNodeId = "inventory-node-reasoning-case";

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
                    ReasoningTrace = "INVENTORY OBSERVED FACT",
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    ReasoningTrace = "inventory observed fact",
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Single(node => string.Equals(node.NodeId, canonicalNodeId, StringComparison.OrdinalIgnoreCase))
            .ReasoningTrace.Should().Be("INVENTORY OBSERVED FACT");
    }

    [Fact]
    public void Merge_preserves_base_graph_case_variant_duplicate_nodes_without_deduping()
    {
        const string canonicalNodeId = "topology-node-a";

        GraphSnapshot baseGraph = new()
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
                    Label = "lower",
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId.ToUpperInvariant(),
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "upper",
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

        merged.Nodes.Should().HaveCount(2);
        merged.Nodes.Should().Contain(node => node.NodeId == canonicalNodeId && node.Label == "lower");
        merged.Nodes.Should().Contain(node => node.NodeId == canonicalNodeId.ToUpperInvariant() && node.Label == "upper");
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
    public void Merge_skips_second_overlay_edge_when_directed_key_differs_only_by_surrounding_whitespace()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = "first",
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = $"  {NodeA}  ",
                    ToNodeId = $"  {NodeB}  ",
                    EdgeType = $"  {GraphEdgeTypes.ConnectsTo}  ",
                    Label = "first",
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        GraphEdge edge = merged.Edges.Should().ContainSingle().Subject;
        edge.FromNodeId.Should().Be(NodeA);
        edge.ToNodeId.Should().Be(NodeB);
        edge.EdgeType.Should().Be(GraphEdgeTypes.ConnectsTo);
        edge.Label.Should().Be("first");
    }

    [Fact]
    public void Merge_skips_second_overlay_edge_when_edge_type_differs_only_by_case()
    {
        const string NodeA = "node-a";
        const string NodeB = "node-b";
        string alternateCaseEdgeType = string.Equals(
            GraphEdgeTypes.ConnectsTo,
            GraphEdgeTypes.ConnectsTo.ToUpperInvariant(),
            StringComparison.Ordinal)
            ? GraphEdgeTypes.ConnectsTo.ToLowerInvariant()
            : GraphEdgeTypes.ConnectsTo.ToUpperInvariant();

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
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = "first",
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = alternateCaseEdgeType,
                    Label = "first",
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        GraphEdge edge = merged.Edges.Should().ContainSingle().Subject;
        edge.EdgeType.Should().Be(GraphEdgeTypes.ConnectsTo);
        edge.Label.Should().Be("first");
    }

    [Fact]
    public void Merge_skips_second_overlay_edge_when_endpoint_node_ids_differ_only_by_case()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = "first",
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA.ToUpperInvariant(),
                    ToNodeId = NodeB.ToUpperInvariant(),
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = "first",
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        GraphEdge edge = merged.Edges.Should().ContainSingle().Subject;
        edge.FromNodeId.Should().Be(NodeA);
        edge.ToNodeId.Should().Be(NodeB);
        edge.Label.Should().Be("first");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_label()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = "primary",
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = "duplicate",
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on Label*");
    }

    [Fact]
    public void Merge_coalesces_overlay_duplicate_edge_labels_when_labels_differ_only_by_casing()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = "CONNECTS",
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = "connects",
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.Label.Should().Be("CONNECTS");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_weight()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 1.0,
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 0.5,
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on Weight*");
    }

    [Fact]
    public void Merge_skips_second_overlay_edge_when_duplicate_edges_share_the_same_weight()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 0.75,
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 0.75,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.Weight.Should().Be(0.75);
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_inference_source()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    InferenceSource = GraphEdgeInferenceSources.InventoryExplicitParentChild,
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    InferenceSource = GraphEdgeInferenceSources.InventoryRbacAssignment,
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on InferenceSource*");
    }

    [Fact]
    public void Merge_coalesces_overlay_duplicate_edge_inference_sources_when_inference_sources_differ_only_by_casing()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    InferenceSource = GraphEdgeInferenceSources.InventoryExplicitParentChild.ToUpperInvariant(),
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    InferenceSource = GraphEdgeInferenceSources.InventoryExplicitParentChild.ToLowerInvariant(),
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.InferenceSource
            .Should().Be(GraphEdgeInferenceSources.InventoryExplicitParentChild.ToUpperInvariant());
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_provenance_kind()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = StructuredDiagramGraphProvenanceKinds.ObservedFact,
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = StructuredDiagramGraphProvenanceKinds.DeterministicInference,
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on ProvenanceKind*");
    }

    [Fact]
    public void Merge_coalesces_overlay_duplicate_edge_provenance_kinds_when_provenance_kinds_differ_only_by_casing()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = StructuredDiagramGraphProvenanceKinds.ObservedFact.ToUpperInvariant(),
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = StructuredDiagramGraphProvenanceKinds.ObservedFact.ToLowerInvariant(),
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.ProvenanceKind
            .Should().Be(StructuredDiagramGraphProvenanceKinds.ObservedFact.ToUpperInvariant());
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_declared_connection_id()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    DeclaredConnectionId = "declared-connection-primary",
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    DeclaredConnectionId = "declared-connection-duplicate",
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on DeclaredConnectionId*");
    }

    [Fact]
    public void Merge_coalesces_overlay_duplicate_edge_declared_connection_ids_when_declared_connection_ids_differ_only_by_casing()
    {
        const string NodeA = "node-a";
        const string NodeB = "node-b";
        const string DeclaredConnectionId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

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
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    DeclaredConnectionId = DeclaredConnectionId.ToUpperInvariant(),
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    DeclaredConnectionId = DeclaredConnectionId.ToLowerInvariant(),
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.DeclaredConnectionId
            .Should().Be(DeclaredConnectionId.ToUpperInvariant());
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_reasoning_trace()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ReasoningTrace = "inventory parent-child link",
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ReasoningTrace = "inventory rbac assignment link",
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on ReasoningTrace*");
    }

    [Fact]
    public void Merge_coalesces_overlay_duplicate_edge_reasoning_traces_when_reasoning_traces_differ_only_by_casing()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ReasoningTrace = "INVENTORY EXPLICIT PARENT",
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ReasoningTrace = "inventory explicit parent",
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.ReasoningTrace
            .Should().Be("INVENTORY EXPLICIT PARENT");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_property_bag_value()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [StructuredDiagramGraphPropertyKeys.ProvenanceKind] =
                            StructuredDiagramGraphProvenanceKinds.ObservedFact,
                    },
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [StructuredDiagramGraphPropertyKeys.ProvenanceKind] =
                            StructuredDiagramGraphProvenanceKinds.DeterministicInference,
                    },
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on Properties*");
    }

    [Fact]
    public void Merge_coalesces_overlay_duplicate_edge_property_values_when_property_values_differ_only_by_casing()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [StructuredDiagramGraphPropertyKeys.ProvenanceKind] =
                            StructuredDiagramGraphProvenanceKinds.ObservedFact.ToUpperInvariant(),
                    },
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [StructuredDiagramGraphPropertyKeys.ProvenanceKind] =
                            StructuredDiagramGraphProvenanceKinds.ObservedFact.ToLowerInvariant(),
                    },
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.Properties[StructuredDiagramGraphPropertyKeys.ProvenanceKind]
            .Should().Be(StructuredDiagramGraphProvenanceKinds.ObservedFact.ToUpperInvariant());
    }

    [Fact]
    public void Merge_backfills_overlay_duplicate_edge_label_from_second_row_when_first_row_omits_label()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = "   ",
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = "inventory link",
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.Label.Should().Be("inventory link");
    }

    [Fact]
    public void Merge_backfills_overlay_duplicate_edge_reasoning_trace_from_second_row_when_first_row_omits_reasoning_trace()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ReasoningTrace = "   ",
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ReasoningTrace = "inventory parent-child link",
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.ReasoningTrace.Should().Be("inventory parent-child link");
    }

    [Fact]
    public void Merge_backfills_overlay_duplicate_edge_inference_source_from_second_row_when_first_row_omits_inference_source()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    InferenceSource = "   ",
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    InferenceSource = GraphEdgeInferenceSources.InventoryExplicitParentChild,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.InferenceSource
            .Should().Be(GraphEdgeInferenceSources.InventoryExplicitParentChild);
    }

    [Fact]
    public void Merge_backfills_overlay_duplicate_edge_provenance_kind_from_second_row_when_first_row_omits_provenance_kind()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = "   ",
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = StructuredDiagramGraphProvenanceKinds.ObservedFact,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.ProvenanceKind
            .Should().Be(StructuredDiagramGraphProvenanceKinds.ObservedFact);
    }

    [Fact]
    public void Merge_backfills_overlay_duplicate_edge_declared_connection_id_from_second_row_when_first_row_omits_declared_connection_id()
    {
        const string NodeA = "node-a";
        const string NodeB = "node-b";
        const string DeclaredConnectionId = "declared-connection-primary";

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
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    DeclaredConnectionId = "   ",
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    DeclaredConnectionId = DeclaredConnectionId,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.DeclaredConnectionId.Should().Be(DeclaredConnectionId);
    }

    [Fact]
    public void Merge_backfills_overlay_duplicate_edge_edge_id_from_second_row_when_first_row_omits_edge_id()
    {
        const string NodeA = "node-a";
        const string NodeB = "node-b";
        const string EdgeId = "inventory-overlay-edge-backfill-id";

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
                    EdgeId = "   ",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                },
                new GraphEdge
                {
                    EdgeId = EdgeId,
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.EdgeId.Should().Be(EdgeId);
    }

    [Fact]
    public void Merge_backfills_overlay_duplicate_edge_weight_from_second_row_when_first_row_omits_weight()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 0,
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 0.75,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.Weight.Should().Be(0.75);
    }

    [Fact]
    public void Merge_backfills_overlay_duplicate_edge_label_into_base_graph_edge_when_multiple_overlay_rows_share_base_directed_key()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "   ",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = "   ",
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
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = "   ",
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = "inventory link",
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.Label.Should().Be("inventory link");
    }

    [Fact]
    public void Merge_backfills_overlay_duplicate_node_label_into_base_graph_node_when_multiple_overlay_rows_share_base_node_id()
    {
        const string canonicalNodeId = "inventory-node-base-backfill";

        GraphSnapshot baseGraph = new()
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
                    Label = "   ",
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
                    Label = "   ",
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL primary",
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().ContainSingle();
        merged.Nodes[0].Label.Should().Be("SQL primary");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_label_for_base_graph_node_id()
    {
        const string canonicalNodeId = "inventory-node-base-label-conflict";

        GraphSnapshot baseGraph = new()
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
                    Label = "   ",
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
                    Label = "SQL primary",
                },
                new GraphNode
                {
                    NodeId = canonicalNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL duplicate",
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on Label*");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_label_for_base_graph_directed_key()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = "   ",
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
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = "inventory primary",
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = "inventory duplicate",
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on Label*");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_weight_for_base_graph_directed_key()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 0.25,
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
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 0.75,
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 0.5,
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on Weight*");
    }

    [Fact]
    public void Merge_preserves_base_edge_weight_when_first_overlay_row_disagrees_on_weight()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 1.0,
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
                    EdgeId = "overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 0.5,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.Weight.Should().Be(1.0);
    }

    [Fact]
    public void Merge_preserves_base_node_label_when_first_overlay_row_disagrees_on_label()
    {
        const string SharedNodeId = "shared-base-node";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "Diagram label",
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "Inventory label",
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().ContainSingle().Which.Label.Should().Be("Diagram label");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_inference_source_for_base_graph_directed_key()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
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
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    InferenceSource = GraphEdgeInferenceSources.InventoryExplicitParentChild,
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    InferenceSource = GraphEdgeInferenceSources.InventoryRbacAssignment,
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on InferenceSource*");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_source_type_for_base_graph_node_id()
    {
        const string SharedNodeId = "inventory-node-base-source-type-conflict";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceType = ArchitectureInventoryGraphSourceTypes.AzureInventorySnapshot,
                },
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceType = "other-source-type",
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on SourceType*");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_provenance_kind_for_base_graph_directed_key()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
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
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = StructuredDiagramGraphProvenanceKinds.ObservedFact,
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = StructuredDiagramGraphProvenanceKinds.DeterministicInference,
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on ProvenanceKind*");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_source_id_for_base_graph_node_id()
    {
        const string SharedNodeId = "inventory-node-base-source-id-conflict";
        const string SourceIdPrimary =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-a";
        const string SourceIdDuplicate =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-b";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceId = SourceIdPrimary,
                },
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceId = SourceIdDuplicate,
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on SourceId*");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_declared_connection_id_for_base_graph_directed_key()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
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
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    DeclaredConnectionId = "declared-connection-primary",
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    DeclaredConnectionId = "declared-connection-duplicate",
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on DeclaredConnectionId*");
    }

    [Fact]
    public void Merge_backfills_base_graph_edge_label_from_first_overlay_row_when_base_label_is_whitespace_only()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = "   ",
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
                    EdgeId = "overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = "inventory connectivity",
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.Label.Should().Be("inventory connectivity");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_reasoning_trace_for_base_graph_directed_key()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
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
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ReasoningTrace = "inventory parent-child link",
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ReasoningTrace = "inventory rbac assignment link",
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on ReasoningTrace*");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_category_for_base_graph_node_id()
    {
        const string SharedNodeId = "inventory-node-base-category-conflict";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Category = GraphTopologyCategories.Network,
                },
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Category = GraphTopologyCategories.Compute,
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on Category*");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_edge_id_for_base_graph_directed_key()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
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
                    EdgeId = "overlay-edge-id-primary",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                },
                new GraphEdge
                {
                    EdgeId = "overlay-edge-id-duplicate",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on EdgeId*");
    }

    [Fact]
    public void Merge_backfills_base_graph_node_label_from_first_overlay_row_when_base_label_is_whitespace_only()
    {
        const string SharedNodeId = "shared-base-node-whitespace-label";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "   ",
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "Inventory SQL",
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().ContainSingle().Which.Label.Should().Be("Inventory SQL");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_property_bag_value_for_base_graph_directed_key()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
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
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [StructuredDiagramGraphPropertyKeys.ProvenanceKind] =
                            StructuredDiagramGraphProvenanceKinds.ObservedFact,
                    },
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [StructuredDiagramGraphPropertyKeys.ProvenanceKind] =
                            StructuredDiagramGraphProvenanceKinds.DeterministicInference,
                    },
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on Properties*");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_reasoning_trace_for_base_graph_node_id()
    {
        const string SharedNodeId = "inventory-node-base-reasoning-conflict";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    ReasoningTrace = "inventory snapshot resource",
                },
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    ReasoningTrace = "inventory relationship edge",
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on ReasoningTrace*");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_property_bag_value_for_base_graph_node_id()
    {
        const string SharedNodeId = "inventory-node-base-property-conflict";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [StructuredDiagramGraphPropertyKeys.ProvenanceKind] =
                            StructuredDiagramGraphProvenanceKinds.ObservedFact,
                    },
                },
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [StructuredDiagramGraphPropertyKeys.ProvenanceKind] =
                            StructuredDiagramGraphProvenanceKinds.DeterministicInference,
                    },
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on Properties*");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_node_type_for_base_graph_node_id()
    {
        const string SharedNodeId = "inventory-node-base-node-type-conflict";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                },
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.Actor,
                    Label = "SQL",
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on NodeType*");
    }

    [Fact]
    public void Merge_backfills_base_graph_node_category_from_first_overlay_row_when_base_category_is_whitespace_only()
    {
        const string SharedNodeId = "shared-base-node-whitespace-category";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Category = "   ",
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Category = GraphTopologyCategories.Compute,
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().ContainSingle().Which.Category.Should().Be(GraphTopologyCategories.Compute);
    }

    [Fact]
    public void Merge_backfills_base_graph_edge_inference_source_from_first_overlay_row_when_base_inference_source_is_whitespace_only()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    InferenceSource = "   ",
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
                    EdgeId = "overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    InferenceSource = GraphEdgeInferenceSources.InventoryExplicitParentChild,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.InferenceSource
            .Should().Be(GraphEdgeInferenceSources.InventoryExplicitParentChild);
    }

    [Fact]
    public void Merge_backfills_base_graph_node_source_id_from_first_overlay_row_when_base_source_id_is_whitespace_only()
    {
        const string SharedNodeId = "shared-base-node-whitespace-source-id";
        const string sourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-primary";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceId = "   ",
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceId = sourceId,
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().ContainSingle().Which.SourceId.Should().Be(sourceId);
    }

    [Fact]
    public void Merge_backfills_base_graph_node_source_type_from_first_overlay_row_when_base_source_type_is_whitespace_only()
    {
        const string SharedNodeId = "shared-base-node-whitespace-source-type";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceType = "   ",
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceType = ArchitectureInventoryGraphSourceTypes.AzureInventorySnapshot,
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().ContainSingle().Which.SourceType
            .Should().Be(ArchitectureInventoryGraphSourceTypes.AzureInventorySnapshot);
    }

    [Fact]
    public void Merge_backfills_base_graph_edge_provenance_kind_from_first_overlay_row_when_base_provenance_kind_is_whitespace_only()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = "   ",
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
                    EdgeId = "overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = StructuredDiagramGraphProvenanceKinds.ObservedFact,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.ProvenanceKind
            .Should().Be(StructuredDiagramGraphProvenanceKinds.ObservedFact);
    }

    [Fact]
    public void Merge_backfills_base_graph_node_reasoning_trace_from_first_overlay_row_when_base_reasoning_trace_is_whitespace_only()
    {
        const string SharedNodeId = "shared-base-node-whitespace-reasoning-trace";
        const string reasoningTrace = "inventory snapshot resource linkage";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    ReasoningTrace = "   ",
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    ReasoningTrace = reasoningTrace,
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().ContainSingle().Which.ReasoningTrace.Should().Be(reasoningTrace);
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_category_for_base_graph_node_id_when_base_category_is_whitespace_only()
    {
        const string SharedNodeId = "inventory-node-base-whitespace-category-conflict";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Category = "   ",
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Category = GraphTopologyCategories.Network,
                },
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Category = GraphTopologyCategories.Compute,
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on Category*");
    }

    [Fact]
    public void Merge_backfills_base_graph_edge_declared_connection_id_from_first_overlay_row_when_base_declared_connection_id_is_whitespace_only()
    {
        const string NodeA = "node-a";
        const string NodeB = "node-b";
        const string declaredConnectionId = "declared-connection-inventory-primary";

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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    DeclaredConnectionId = "   ",
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
                    EdgeId = "overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    DeclaredConnectionId = declaredConnectionId,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.DeclaredConnectionId.Should().Be(declaredConnectionId);
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_inference_source_for_base_graph_directed_key_when_base_inference_source_is_whitespace_only()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    InferenceSource = "   ",
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
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    InferenceSource = GraphEdgeInferenceSources.InventoryExplicitParentChild,
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    InferenceSource = GraphEdgeInferenceSources.InventoryRbacAssignment,
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on InferenceSource*");
    }

    [Fact]
    public void Merge_backfills_base_graph_edge_reasoning_trace_from_first_overlay_row_when_base_reasoning_trace_is_whitespace_only()
    {
        const string NodeA = "node-a";
        const string NodeB = "node-b";
        const string reasoningTrace = "inventory parent-child explicit link";

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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ReasoningTrace = "   ",
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
                    EdgeId = "overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ReasoningTrace = reasoningTrace,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.ReasoningTrace.Should().Be(reasoningTrace);
    }

    [Fact]
    public void Merge_backfills_base_graph_node_node_type_from_first_overlay_row_when_base_node_type_is_whitespace_only()
    {
        const string SharedNodeId = "shared-base-node-whitespace-node-type";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = "   ",
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().ContainSingle().Which.NodeType.Should().Be(GraphNodeTypes.TopologyResource);
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_source_id_for_base_graph_node_id_when_base_source_id_is_whitespace_only()
    {
        const string SharedNodeId = "inventory-node-base-whitespace-source-id-conflict";
        const string SourceIdPrimary =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-a";
        const string SourceIdDuplicate =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-b";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceId = "   ",
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceId = SourceIdPrimary,
                },
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceId = SourceIdDuplicate,
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on SourceId*");
    }

    [Fact]
    public void Merge_backfills_base_graph_edge_edge_id_from_first_overlay_row_when_base_edge_id_is_whitespace_only()
    {
        const string NodeA = "node-a";
        const string NodeB = "node-b";
        const string edgeId = "inventory-overlay-edge-id";

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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "   ",
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
                    EdgeId = edgeId,
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.EdgeId.Should().Be(edgeId);
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_provenance_kind_for_base_graph_directed_key_when_base_provenance_kind_is_whitespace_only()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = "   ",
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
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = StructuredDiagramGraphProvenanceKinds.ObservedFact,
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = StructuredDiagramGraphProvenanceKinds.DeterministicInference,
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on ProvenanceKind*");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_source_type_for_base_graph_node_id_when_base_source_type_is_whitespace_only()
    {
        const string SharedNodeId = "inventory-node-base-whitespace-source-type-conflict";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceType = "   ",
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceType = ArchitectureInventoryGraphSourceTypes.AzureInventorySnapshot,
                },
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceType = "other-source-type",
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on SourceType*");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_declared_connection_id_for_base_graph_directed_key_when_base_declared_connection_id_is_whitespace_only()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    DeclaredConnectionId = "   ",
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
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    DeclaredConnectionId = "declared-connection-primary",
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    DeclaredConnectionId = "declared-connection-duplicate",
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on DeclaredConnectionId*");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_reasoning_trace_for_base_graph_node_id_when_base_reasoning_trace_is_whitespace_only()
    {
        const string SharedNodeId = "inventory-node-base-whitespace-reasoning-trace-conflict";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    ReasoningTrace = "   ",
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    ReasoningTrace = "inventory snapshot resource",
                },
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    ReasoningTrace = "conflicting inventory trace",
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on ReasoningTrace*");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_edge_id_for_base_graph_directed_key_when_base_edge_id_is_whitespace_only()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "   ",
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
                    EdgeId = "overlay-edge-id-primary",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                },
                new GraphEdge
                {
                    EdgeId = "overlay-edge-id-duplicate",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on EdgeId*");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_reasoning_trace_for_base_graph_directed_key_when_base_reasoning_trace_is_whitespace_only()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ReasoningTrace = "   ",
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
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ReasoningTrace = "inventory parent-child link",
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ReasoningTrace = "conflicting inventory link trace",
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on ReasoningTrace*");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_node_type_for_base_graph_node_id_when_base_node_type_is_whitespace_only()
    {
        const string SharedNodeId = "inventory-node-base-whitespace-node-type-conflict";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = "   ",
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                },
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.Actor,
                    Label = "SQL",
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on NodeType*");
    }

    [Fact]
    public void Merge_preserves_base_node_source_type_when_first_overlay_row_disagrees_on_source_type()
    {
        const string SharedNodeId = "shared-base-node-source-type";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceType = ArchitectureInventoryGraphSourceTypes.AzureInventorySnapshot,
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceType = "other-source-type",
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().ContainSingle().Which.SourceType
            .Should().Be(ArchitectureInventoryGraphSourceTypes.AzureInventorySnapshot);
    }

    [Fact]
    public void Merge_preserves_base_node_source_id_when_first_overlay_row_disagrees_on_source_id()
    {
        const string SharedNodeId = "shared-base-node-source-id";
        const string baseSourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-base";
        const string overlaySourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-overlay";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceId = baseSourceId,
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceId = overlaySourceId,
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().ContainSingle().Which.SourceId.Should().Be(baseSourceId);
    }

    [Fact]
    public void Merge_preserves_base_edge_inference_source_when_first_overlay_row_disagrees_on_inference_source()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    InferenceSource = GraphEdgeInferenceSources.InventoryExplicitParentChild,
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
                    EdgeId = "overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    InferenceSource = GraphEdgeInferenceSources.InventoryRbacAssignment,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.InferenceSource
            .Should().Be(GraphEdgeInferenceSources.InventoryExplicitParentChild);
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_label_for_base_graph_node_id_when_base_label_is_populated()
    {
        const string SharedNodeId = "inventory-node-base-populated-label-conflict";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "Diagram SQL",
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "Inventory SQL primary",
                },
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "Inventory SQL duplicate",
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on Label*");
    }

    [Fact]
    public void Merge_preserves_base_node_reasoning_trace_when_first_overlay_row_disagrees_on_reasoning_trace()
    {
        const string SharedNodeId = "shared-base-node-reasoning-trace";
        const string baseTrace = "diagram observed resource";
        const string overlayTrace = "inventory snapshot resource";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    ReasoningTrace = baseTrace,
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    ReasoningTrace = overlayTrace,
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().ContainSingle().Which.ReasoningTrace.Should().Be(baseTrace);
    }

    [Fact]
    public void Merge_preserves_base_edge_provenance_kind_when_first_overlay_row_disagrees_on_provenance_kind()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = StructuredDiagramGraphProvenanceKinds.ObservedFact,
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
                    EdgeId = "overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = StructuredDiagramGraphProvenanceKinds.DeterministicInference,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.ProvenanceKind
            .Should().Be(StructuredDiagramGraphProvenanceKinds.ObservedFact);
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_category_for_base_graph_node_id_when_base_category_is_populated()
    {
        const string SharedNodeId = "inventory-node-base-populated-category-conflict";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Category = GraphTopologyCategories.Network,
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Category = GraphTopologyCategories.Network,
                },
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Category = GraphTopologyCategories.Compute,
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on Category*");
    }

    [Fact]
    public void Merge_preserves_base_edge_declared_connection_id_when_first_overlay_row_disagrees_on_declared_connection_id()
    {
        const string NodeA = "node-a";
        const string NodeB = "node-b";
        const string baseDeclaredConnectionId = "declared-connection-base";
        const string overlayDeclaredConnectionId = "declared-connection-overlay";

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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    DeclaredConnectionId = baseDeclaredConnectionId,
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
                    EdgeId = "overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    DeclaredConnectionId = overlayDeclaredConnectionId,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.DeclaredConnectionId.Should().Be(baseDeclaredConnectionId);
    }

    [Fact]
    public void Merge_preserves_base_node_category_when_first_overlay_row_disagrees_on_category()
    {
        const string SharedNodeId = "shared-base-node-category";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Category = GraphTopologyCategories.Network,
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    Category = GraphTopologyCategories.Compute,
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().ContainSingle().Which.Category.Should().Be(GraphTopologyCategories.Network);
    }

    [Fact]
    public void Merge_preserves_base_edge_edge_id_when_first_overlay_row_disagrees_on_edge_id()
    {
        const string NodeA = "node-a";
        const string NodeB = "node-b";
        const string baseEdgeId = "base-edge-id-retained";

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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = baseEdgeId,
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
                    EdgeId = "overlay-edge-id-conflict",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.EdgeId.Should().Be(baseEdgeId);
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_source_type_for_base_graph_node_id_when_base_source_type_is_populated()
    {
        const string SharedNodeId = "inventory-node-base-populated-source-type-conflict";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceType = ArchitectureInventoryGraphSourceTypes.AzureInventorySnapshot,
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceType = ArchitectureInventoryGraphSourceTypes.AzureInventorySnapshot,
                },
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceType = "other-source-type",
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on SourceType*");
    }

    [Fact]
    public void Merge_preserves_base_edge_reasoning_trace_when_first_overlay_row_disagrees_on_reasoning_trace()
    {
        const string NodeA = "node-a";
        const string NodeB = "node-b";
        const string baseTrace = "diagram connectivity trace";
        const string overlayTrace = "inventory connectivity trace";

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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ReasoningTrace = baseTrace,
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
                    EdgeId = "overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ReasoningTrace = overlayTrace,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.ReasoningTrace.Should().Be(baseTrace);
    }

    [Fact]
    public void Merge_preserves_base_node_node_type_when_first_overlay_row_disagrees_on_node_type()
    {
        const string SharedNodeId = "shared-base-node-node-type";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.Actor,
                    Label = "SQL",
                },
            ],
            Edges = [],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Nodes.Should().ContainSingle().Which.NodeType.Should().Be(GraphNodeTypes.TopologyResource);
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_nodes_disagree_on_source_id_for_base_graph_node_id_when_base_source_id_is_populated()
    {
        const string SharedNodeId = "inventory-node-base-populated-source-id-conflict";
        const string SourceIdPrimary =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-a";
        const string SourceIdDuplicate =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-b";

        GraphSnapshot baseGraph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceId = SourceIdPrimary,
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
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceId = SourceIdPrimary,
                },
                new GraphNode
                {
                    NodeId = SharedNodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "SQL",
                    SourceId = SourceIdDuplicate,
                },
            ],
            Edges = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on SourceId*");
    }

    [Fact]
    public void Merge_preserves_base_edge_label_when_first_overlay_row_disagrees_on_label()
    {
        const string NodeA = "node-a";
        const string NodeB = "node-b";
        const string baseLabel = "diagram edge label";
        const string overlayLabel = "inventory edge label";

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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = baseLabel,
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
                    EdgeId = "overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = overlayLabel,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.Label.Should().Be(baseLabel);
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_provenance_kind_for_base_graph_directed_key_when_base_provenance_kind_is_populated()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = StructuredDiagramGraphProvenanceKinds.ObservedFact,
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
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = StructuredDiagramGraphProvenanceKinds.ObservedFact,
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = StructuredDiagramGraphProvenanceKinds.DeterministicInference,
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on ProvenanceKind*");
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_weight_for_base_graph_directed_key_when_base_weight_is_omitted()
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
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "base-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 0,
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
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 0.75,
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 0.5,
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on Weight*");
    }

    [Fact]
    public void Merge_backfills_overlay_duplicate_edge_properties_from_second_row_when_first_row_omits_property_key()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                },
                new GraphEdge
                {
                    EdgeId = "shared-overlay-edge-id",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [StructuredDiagramGraphPropertyKeys.ProvenanceKind] =
                            StructuredDiagramGraphProvenanceKinds.ObservedFact,
                    },
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle()
            .Which.Properties[StructuredDiagramGraphPropertyKeys.ProvenanceKind]
            .Should().Be(StructuredDiagramGraphProvenanceKinds.ObservedFact);
    }

    [Fact]
    public void Merge_throws_when_overlay_duplicate_edges_disagree_on_edge_id()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "overlay-edge-id-primary",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                },
                new GraphEdge
                {
                    EdgeId = "overlay-edge-id-duplicate",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on EdgeId*");
    }

    [Fact]
    public void Merge_coalesces_overlay_duplicate_edge_ids_when_edge_ids_differ_only_by_casing()
    {
        const string NodeA = "node-a";
        const string NodeB = "node-b";
        const string EdgeId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

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
                    EdgeId = EdgeId.ToUpperInvariant(),
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                },
                new GraphEdge
                {
                    EdgeId = EdgeId.ToLowerInvariant(),
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        merged.Edges.Should().ContainSingle().Which.EdgeId.Should().Be(EdgeId.ToUpperInvariant());
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
    public void BuildOverlay_prefers_arm_name_segment_over_whitespace_only_resource_type_for_label()
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
                    ResourceRowId = Guid.Parse("16161616-1616-1616-1616-161616161616"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armId,
                    ResourceType = "   ",
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
    public void BuildOverlay_stamps_trimmed_arm_id_label_when_name_segment_and_resource_type_are_whitespace_only()
    {
        const string armIdWithWhitespaceNameSegment =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/   ";

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
                    ResourceRowId = Guid.Parse("17171717-1717-1717-1717-171717171717"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdWithWhitespaceNameSegment,
                    ResourceType = "   ",
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

        overlay.Nodes.Should().ContainSingle().Which.Label.Should().Be(armIdWithWhitespaceNameSegment.Trim());
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
    public void BuildOverlay_omits_resource_group_and_subscription_id_properties_when_values_are_whitespace_only()
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
                    ResourceRowId = Guid.Parse("18181818-1818-1818-1818-181818181818"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armId,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "   ",
                    SubscriptionId = "   ",
                },
            ],
            Relationships = [],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        GraphNode node = overlay.Nodes.Should().ContainSingle().Subject;
        node.Properties.Should().NotContainKey("arm.resourceGroup");
        node.Properties.Should().NotContainKey("arm.subscriptionId");
    }

    [Fact]
    public void BuildOverlay_omits_parent_resource_id_property_when_parent_resource_id_is_whitespace_only()
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
                    ResourceRowId = Guid.Parse("19191919-1919-1919-1919-191919191919"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armId,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                    ParentResourceId = "   ",
                },
            ],
            Relationships = [],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        GraphNode node = overlay.Nodes.Should().ContainSingle().Subject;
        node.Properties.Should().NotContainKey("arm.parentId");
    }

    [Fact]
    public void BuildOverlay_stamps_normalized_parent_resource_id_when_parent_resource_id_has_surrounding_whitespace()
    {
        const string armId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-prod";
        const string parentArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/parent-vnet";
        string paddedParentArmId = $"  {parentArmId.ToUpperInvariant()}  ";

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
                    ResourceRowId = Guid.Parse("20202020-2020-2020-2020-202020202020"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armId,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                    ParentResourceId = paddedParentArmId,
                },
            ],
            Relationships = [],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        GraphNode node = overlay.Nodes.Should().ContainSingle().Subject;
        node.Properties["arm.parentId"].Should().Be(ArmResourceIdNormalizer.Normalize(parentArmId));
    }

    [Fact]
    public void BuildOverlay_deduplicates_resources_and_stamps_normalized_parent_when_parent_resource_id_differs_only_by_case()
    {
        const string armIdLower =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-prod";
        const string armIdUpper =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Network/virtualNetworks/VNET-PROD";
        const string parentArmIdLower =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/parent-vnet";
        string parentArmIdUpper = parentArmIdLower.ToUpperInvariant();

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
                    AzureResourceId = armIdLower,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                    ParentResourceId = parentArmIdLower,
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("88888888-8888-8888-8888-888888888888"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdUpper,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                    ParentResourceId = parentArmIdUpper,
                },
            ],
            Relationships = [],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        GraphNode node = overlay.Nodes.Should().ContainSingle().Subject;
        node.Properties["arm.parentId"].Should().Be(ArmResourceIdNormalizer.Normalize(parentArmIdLower));
    }

    [Fact]
    public void BuildOverlay_backfills_parent_resource_id_from_duplicate_row_when_winning_row_omits_parent()
    {
        const string armIdLower =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-prod";
        const string armIdUpper =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Network/virtualNetworks/VNET-PROD";
        const string parentArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/parent-vnet";

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
                    AzureResourceId = armIdUpper,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdLower,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                    ParentResourceId = parentArmId,
                },
            ],
            Relationships = [],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        GraphNode node = overlay.Nodes.Should().ContainSingle().Subject;
        node.Properties["arm.parentId"].Should().Be(ArmResourceIdNormalizer.Normalize(parentArmId));
    }

    [Fact]
    public void BuildOverlay_throws_when_duplicate_resource_rows_disagree_on_parent_resource_id()
    {
        const string armIdLower =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-prod";
        const string armIdUpper =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Network/virtualNetworks/VNET-PROD";
        const string parentArmIdWinner =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/parent-a";
        const string parentArmIdDuplicate =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/parent-b";

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
                    ResourceRowId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdUpper,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                    ParentResourceId = parentArmIdWinner,
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdLower,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                    ParentResourceId = parentArmIdDuplicate,
                },
            ],
            Relationships = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on arm.parentId*");
    }

    [Fact]
    public void BuildOverlay_throws_when_duplicate_resource_rows_disagree_on_resource_group()
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
                    ResourceRowId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdUpper,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg-a",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdLower,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg-b",
                    SubscriptionId = "sub",
                },
            ],
            Relationships = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on arm.resourceGroup*");
    }

    [Fact]
    public void BuildOverlay_throws_when_duplicate_resource_rows_disagree_on_subscription_id()
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
                    ResourceRowId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdUpper,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub-a",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("10101010-1010-1010-1010-101010101010"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdLower,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub-b",
                },
            ],
            Relationships = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on arm.subscriptionId*");
    }

    [Fact]
    public void BuildOverlay_backfills_resource_group_from_duplicate_row_when_winning_row_omits_resource_group()
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
                    ResourceRowId = Guid.Parse("11111111-1111-1111-1111-111111111112"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdUpper,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("11111111-1111-1111-1111-111111111113"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdLower,
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
        node.Properties["arm.resourceGroup"].Should().Be("rg");
    }

    [Fact]
    public void BuildOverlay_throws_when_duplicate_resource_rows_disagree_on_cloud_resource_id()
    {
        const string armIdLower =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-prod";
        const string armIdUpper =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Network/virtualNetworks/VNET-PROD";
        Guid cloudIdWinner = Guid.Parse("12121212-1212-1212-1212-121212121212");
        Guid cloudIdDuplicate = Guid.Parse("13131313-1313-1313-1313-131313131313");

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
                    ResourceRowId = Guid.Parse("14141414-1414-1414-1414-141414141414"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdUpper,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                    CloudResourceId = cloudIdWinner,
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("15151515-1515-1515-1515-151515151515"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdLower,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                    CloudResourceId = cloudIdDuplicate,
                },
            ],
            Relationships = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on cloudResourceId*");
    }

    [Fact]
    public void BuildOverlay_backfills_cloud_resource_id_property_from_duplicate_row_when_winning_row_omits_cloud_resource_id()
    {
        const string armIdLower =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-prod";
        const string armIdUpper =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Network/virtualNetworks/VNET-PROD";
        Guid cloudIdFromDuplicate = Guid.Parse("16161616-1616-1616-1616-161616161616");

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
                    ResourceRowId = Guid.Parse("17171717-1717-1717-1717-171717171717"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdUpper,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                    CloudResourceId = null,
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("18181818-1818-1818-1818-181818181818"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdLower,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                    CloudResourceId = cloudIdFromDuplicate,
                },
            ],
            Relationships = [],
        };

        GraphSnapshot overlay = ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        GraphNode node = overlay.Nodes.Should().ContainSingle().Subject;
        node.Properties["cloudResourceId"].Should().Be(cloudIdFromDuplicate.ToString("D"));
        node.NodeId.Should().NotBe(cloudIdFromDuplicate.ToString("D"));
    }

    [Fact]
    public void BuildOverlay_throws_when_duplicate_resource_rows_disagree_on_resource_type()
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
                    ResourceRowId = Guid.Parse("19191919-1919-1919-1919-191919191919"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdUpper,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdLower,
                    ResourceType = "Microsoft.Compute/virtualMachines",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
            ],
            Relationships = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on arm.type*");
    }

    [Fact]
    public void BuildOverlay_backfills_arm_type_and_category_from_duplicate_row_when_winning_row_resource_type_is_empty()
    {
        const string armIdLower =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-prod";
        const string armIdUpper =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Network/virtualNetworks/VNET-PROD";
        const string resourceType = "Microsoft.Network/virtualNetworks";

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
                    ResourceRowId = Guid.Parse("1b1b1b1b-1b1b-1b1b-1b1b-1b1b1b1b1b1b"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdUpper,
                    ResourceType = "   ",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("1c1c1c1c-1c1c-1c1c-1c1c-1c1c1c1c1c1c"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdLower,
                    ResourceType = resourceType,
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
        node.Properties["arm.type"].Should().Be(resourceType);
        node.Category.Should().Be(GraphTopologyCategories.Network);
    }

    [Fact]
    public void BuildOverlay_throws_when_duplicate_resource_rows_disagree_on_label()
    {
        const string armIdWithoutTrailingSlash =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-prod";
        const string armIdWithTrailingSlash =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-prod/";

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
                    ResourceRowId = Guid.Parse("1d1d1d1d-1d1d-1d1d-1d1d-1d1d1d1d1d1d"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdWithoutTrailingSlash,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("1e1e1e1e-1e1e-1e1e-1e1e-1e1e1e1e1e1e"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdWithTrailingSlash,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
            ],
            Relationships = [],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphBuilder.BuildOverlay(
            snapshot,
            RunId,
            ContextSnapshotId);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*disagree on Label*");
    }

    [Fact]
    public void BuildOverlay_coalesces_label_when_duplicate_rows_differ_only_by_arm_id_casing()
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
                    ResourceRowId = Guid.Parse("1f1f1f1f-1f1f-1f1f-1f1f-1f1f1f1f1f1f"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdUpper,
                    ResourceType = "Microsoft.Network/virtualNetworks",
                    ResourceGroup = "rg",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.Parse("20202020-2020-2020-2020-202020202021"),
                    SnapshotId = SnapshotId,
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    AzureResourceId = armIdLower,
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
        node.Label.Should().Be("VNET-PROD");
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
    public void BuildOverlay_deduplicates_relationships_when_endpoints_differ_only_by_surrounding_whitespace()
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
    public void Merge_deduplicates_overlay_edge_property_keys_differing_only_by_case_when_appending_inventory_edge()
    {
        const string NodeA = "node-a";
        const string NodeB = "node-b";
        const string SourceEvidenceId = "evidence-42";
        const string CanonicalPropertyKey = "sourceEvidenceItemId";
        const string CaseVariantPropertyKey = "SourceEvidenceItemId";

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
                        [CanonicalPropertyKey] = SourceEvidenceId,
                        [CaseVariantPropertyKey] = SourceEvidenceId,
                    },
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        GraphEdge edge = merged.Edges.Should().ContainSingle().Subject;
        edge.Properties.Should().HaveCount(1);
        edge.Properties[CanonicalPropertyKey].Should().Be(SourceEvidenceId);
        edge.Properties[CaseVariantPropertyKey].Should().Be(SourceEvidenceId);
    }

    [Fact]
    public void Merge_deduplicates_overlay_edge_property_keys_differing_only_by_padding_when_appending_inventory_edge()
    {
        const string NodeA = "node-a";
        const string NodeB = "node-b";
        const string SourceEvidenceId = "evidence-42";
        const string CanonicalPropertyKey = "sourceEvidenceItemId";
        const string PaddedPropertyKey = "  sourceEvidenceItemId  ";

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
                        [CanonicalPropertyKey] = SourceEvidenceId,
                        [PaddedPropertyKey] = SourceEvidenceId,
                    },
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        GraphEdge edge = merged.Edges.Should().ContainSingle().Subject;
        edge.Properties.Should().HaveCount(1);
        edge.Properties[CanonicalPropertyKey].Should().Be(SourceEvidenceId);
        edge.Properties[PaddedPropertyKey.Trim()].Should().Be(SourceEvidenceId);
    }

    [Fact]
    public void Merge_skips_whitespace_only_overlay_property_values_when_appending_inventory_edge()
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
                        ["sourceEvidenceItemId"] = "   ",
                    },
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        GraphEdge edge = merged.Edges.Should().ContainSingle().Subject;
        edge.Properties.Should().BeEmpty();
    }

    [Fact]
    public void Merge_appends_inventory_overlay_edge_when_properties_are_null()
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
            Nodes = [],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "overlay-edge",
                    FromNodeId = NodeA,
                    ToNodeId = NodeB,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Properties = null!,
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        GraphEdge edge = merged.Edges.Should().ContainSingle().Subject;
        edge.Properties.Should().BeEmpty();
    }

    [Fact]
    public void Merge_appends_inventory_overlay_edge_when_property_bag_contains_only_whitespace_entries()
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
                        [string.Empty] = "   ",
                        ["   "] = string.Empty,
                        ["  \t  "] = "  ",
                    },
                },
            ],
        };

        GraphSnapshot merged = ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        GraphEdge edge = merged.Edges.Should().ContainSingle().Subject;
        edge.EdgeType.Should().Be(GraphEdgeTypes.ConnectsTo);
        edge.Properties.Should().BeEmpty();
    }

    [Fact]
    public void Merge_throws_when_overlay_edge_property_keys_differ_only_by_case_and_values_conflict()
    {
        const string NodeA = "node-a";
        const string NodeB = "node-b";
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
                        ["sourceEvidenceItemId"] = SourceEvidenceId,
                        ["SourceEvidenceItemId"] = "evidence-conflict",
                    },
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*duplicate keys that collide under ordinal case-insensitive comparison*");
    }

    [Fact]
    public void Merge_throws_when_overlay_edge_property_keys_differ_only_by_padding_and_values_conflict()
    {
        const string NodeA = "node-a";
        const string NodeB = "node-b";
        const string CanonicalPropertyKey = "sourceEvidenceItemId";
        const string PaddedPropertyKey = "  sourceEvidenceItemId  ";

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
                        [CanonicalPropertyKey] = "evidence-42",
                        [PaddedPropertyKey] = "evidence-conflict",
                    },
                },
            ],
        };

        Action act = () => ArchitectureInventoryObservedFactGraphOverlayMerger.Merge(baseGraph, overlay);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*duplicate keys that collide under ordinal case-insensitive comparison*");
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
