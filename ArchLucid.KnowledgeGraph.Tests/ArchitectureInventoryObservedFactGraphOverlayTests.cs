using ArchLucid.Contracts.Persistence.Graph;
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
        resourceNode.SourceType.Should().Be(ArchitectureInventoryGraphSourceTypes.AzureInventorySnapshot);
        resourceNode.NodeId.Should().Be(CloudResourceId.ToString("D"));
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
