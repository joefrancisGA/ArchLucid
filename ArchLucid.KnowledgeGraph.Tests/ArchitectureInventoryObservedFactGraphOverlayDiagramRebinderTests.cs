using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Diagram;
using ArchLucid.KnowledgeGraph.Inventory;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureInventoryObservedFactGraphOverlayDiagramRebinderTests
{
    private static readonly Guid RunId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ContextSnapshotId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid CloudResourceId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private const string ArmResourceId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/pay-sql-prod";

    [Fact]
    public void Rebind_matchingDisplayName_dropsLeftoverDiagramNodeAndStampsBoundId()
    {
        GraphSnapshot overlay = BuildOverlayNode(label: "pay-sql-prod", armResourceId: ArmResourceId);
        GraphSnapshot merged = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                BuildDiagramNode("diagram-node:sql", "pay-sql-prod"),
                overlay.Nodes[0],
                new GraphNode
                {
                    NodeId = "context-node",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "Context",
                },
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "e1",
                    FromNodeId = "diagram-node:sql",
                    ToNodeId = "context-node",
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                },
            ],
        };

        GraphSnapshot rebound = ArchitectureInventoryObservedFactGraphOverlayDiagramRebinder
            .RebindLeftoverDiagramNodes(merged, overlay);

        rebound.Nodes.Should().NotContain(node => node.NodeId.StartsWith("diagram-node:", StringComparison.Ordinal));
        GraphNode overlayNode = rebound.Nodes.Should().ContainSingle(node =>
            node.NodeId == CloudResourceId.ToString("D")).Subject;
        overlayNode.Properties[StructuredDiagramGraphPropertyKeys.BoundDiagramNodeId]
            .Should().Be("diagram-node:sql");
        overlayNode.Properties[StructuredDiagramGraphPropertyKeys.ProvenanceKind]
            .Should().Be(StructuredDiagramGraphProvenanceKinds.ObservedFact);
        rebound.Edges.Should().ContainSingle(edge =>
            edge.FromNodeId == CloudResourceId.ToString("D") && edge.ToNodeId == "context-node");
    }

    [Fact]
    public void Rebind_armLabel_bindsViaArmResourceId()
    {
        GraphSnapshot overlay = BuildOverlayNode(label: "pay-sql-prod", armResourceId: ArmResourceId);
        GraphSnapshot merged = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                BuildDiagramNode("diagram-node:arm", ArmResourceId),
                overlay.Nodes[0],
            ],
            Edges = [],
        };

        GraphSnapshot rebound = ArchitectureInventoryObservedFactGraphOverlayDiagramRebinder
            .RebindLeftoverDiagramNodes(merged, overlay);

        rebound.Nodes.Should().NotContain(node => node.NodeId == "diagram-node:arm");
        rebound.Nodes.Should().ContainSingle(node => node.NodeId == CloudResourceId.ToString("D"));
    }

    [Fact]
    public void Rebind_unmatchedLeftover_leavesDiagramNode()
    {
        GraphSnapshot overlay = BuildOverlayNode(label: "pay-sql-prod", armResourceId: ArmResourceId);
        GraphSnapshot merged = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes =
            [
                BuildDiagramNode("diagram-node:other", "unrelated-vm"),
                overlay.Nodes[0],
            ],
            Edges = [],
        };

        GraphSnapshot rebound = ArchitectureInventoryObservedFactGraphOverlayDiagramRebinder
            .RebindLeftoverDiagramNodes(merged, overlay);

        rebound.Should().BeSameAs(merged);
        rebound.Nodes.Should().Contain(node => node.NodeId == "diagram-node:other");
    }

    [Fact]
    public void Rebind_emptyOverlay_returnsMergedUnchanged()
    {
        GraphSnapshot merged = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes = [BuildDiagramNode("diagram-node:sql", "pay-sql-prod")],
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

        GraphSnapshot rebound = ArchitectureInventoryObservedFactGraphOverlayDiagramRebinder
            .RebindLeftoverDiagramNodes(merged, emptyOverlay);

        rebound.Should().BeSameAs(merged);
    }

    private static GraphSnapshot BuildOverlayNode(string label, string armResourceId)
    {
        GraphNode node = new()
        {
            NodeId = CloudResourceId.ToString("D"),
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            SourceType = ArchitectureInventoryGraphSourceTypes.AzureInventorySnapshot,
            SourceId = armResourceId,
            Properties =
            {
                [StructuredDiagramGraphPropertyKeys.ProvenanceKind] =
                    StructuredDiagramGraphProvenanceKinds.ObservedFact,
                ["armResourceId"] = armResourceId,
                ["arm.id"] = armResourceId,
                ["inventory.snapshotId"] = Guid.NewGuid().ToString("D"),
            },
        };

        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            Nodes = [node],
            Edges = [],
        };
    }

    private static GraphNode BuildDiagramNode(string nodeId, string label)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            SourceType = StructuredDiagramGraphSourceTypes.StructuredDiagram,
            SourceId = nodeId,
        };
    }
}
