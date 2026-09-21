using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramResourceGroupCellFlowPlannerTests
{
    [Fact]
    public void OrderCells_places_from_cell_left_of_to_when_order_key_is_inverted()
    {
        DiagramNode fromNode = Node("adf", orderKey: 10, resourceGroup: "rg-adf");
        DiagramNode toNode = Node("storage", orderKey: 0, resourceGroup: "rg-storage");
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> packed =
            DiagramResourceGroupPacker.PartitionCells([fromNode, toNode]);

        packed.Should().HaveCount(2);
        packed[0].Nodes.Single().NodeId.Should().Be("storage");

        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> ordered =
            DiagramResourceGroupCellFlowPlanner.OrderCells(
                packed,
                [Edge("adf", "storage")]);

        ordered.Select(cell => cell.Nodes.Single().NodeId).Should().Equal("adf", "storage");
    }

    [Fact]
    public void OrderCells_places_three_cell_chain_in_from_to_order()
    {
        DiagramResourceGroupPacker.ResourceGroupCell cellA = Singleton("a", orderKey: 2);
        DiagramResourceGroupPacker.ResourceGroupCell cellB = Singleton("b", orderKey: 1);
        DiagramResourceGroupPacker.ResourceGroupCell cellC = Singleton("c", orderKey: 0);

        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> ordered =
            DiagramResourceGroupCellFlowPlanner.OrderCells(
                [cellC, cellB, cellA],
                [
                    Edge("a", "b"),
                    Edge("b", "c"),
                ]);

        ordered.Select(cell => cell.Nodes.Single().NodeId).Should().Equal("a", "b", "c");
    }

    [Fact]
    public void OrderCells_keeps_packer_order_for_two_cell_cycle()
    {
        DiagramResourceGroupPacker.ResourceGroupCell cellA = Singleton("a", orderKey: 1);
        DiagramResourceGroupPacker.ResourceGroupCell cellB = Singleton("b", orderKey: 0);

        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> original = [cellB, cellA];
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> ordered =
            DiagramResourceGroupCellFlowPlanner.OrderCells(
                original,
                [
                    Edge("a", "b"),
                    Edge("b", "a"),
                ]);

        ordered.Select(cell => cell.Nodes.Single().NodeId).Should().Equal("b", "a");
    }

    [Fact]
    public void OrderCells_keeps_packer_order_when_there_are_no_inter_cell_edges()
    {
        DiagramResourceGroupPacker.ResourceGroupCell cellA = Singleton("a", orderKey: 1);
        DiagramResourceGroupPacker.ResourceGroupCell cellB = Singleton("b", orderKey: 0);

        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> original = [cellB, cellA];
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> ordered =
            DiagramResourceGroupCellFlowPlanner.OrderCells(original, []);

        ordered.Select(cell => cell.Nodes.Single().NodeId).Should().Equal("b", "a");
    }

    [Fact]
    public void OrderCells_returns_same_instance_for_single_cell()
    {
        DiagramResourceGroupPacker.ResourceGroupCell cell = Singleton("only", orderKey: 0);

        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> original = [cell];
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> ordered =
            DiagramResourceGroupCellFlowPlanner.OrderCells(original, [Edge("only", "only")]);

        ordered.Should().BeSameAs(original);
    }

    [Fact]
    public void OrderCells_throws_when_cells_are_null()
    {
        Action act = () => DiagramResourceGroupCellFlowPlanner.OrderCells(null!, []);

        act.Should().Throw<ArgumentNullException>().WithParameterName("cells");
    }

    [Fact]
    public void OrderCells_throws_when_visible_edges_are_null()
    {
        Action act = () => DiagramResourceGroupCellFlowPlanner.OrderCells([], null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("visibleEdges");
    }

    private static DiagramResourceGroupPacker.ResourceGroupCell Singleton(string nodeId, int orderKey)
    {
        return new DiagramResourceGroupPacker.ResourceGroupCell(null, [Node(nodeId, orderKey, resourceGroup: null)]);
    }

    private static DiagramNode Node(string nodeId, int orderKey, string? resourceGroup)
    {
        return new DiagramNode
        {
            NodeId = nodeId,
            Label = nodeId,
            NodeType = "TopologyResource",
            ArmResourceGroup = resourceGroup,
            OrderKey = orderKey,
        };
    }

    private static DiagramEdge Edge(string fromNodeId, string toNodeId)
    {
        return new DiagramEdge
        {
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            Label = "connects",
        };
    }
}
