using ArchLucid.ArtifactSynthesis.Compilers;
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
    public void GroupByLayers_places_from_cell_in_column_zero()
    {
        DiagramResourceGroupPacker.ResourceGroupCell fromCell = Singleton("adf", orderKey: 10, resourceGroup: "rg-adf");
        DiagramResourceGroupPacker.ResourceGroupCell toCell = Singleton("storage", orderKey: 0, resourceGroup: "rg-storage");

        IReadOnlyList<IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell>> layers =
            DiagramResourceGroupCellFlowPlanner.GroupByLayers(
                [toCell, fromCell],
                [Edge("adf", "storage")]);

        layers.Should().HaveCount(2);
        layers[0].Select(cell => cell.Nodes.Single().NodeId).Should().Equal("adf");
        layers[1].Select(cell => cell.Nodes.Single().NodeId).Should().Equal("storage");
    }

    [Fact]
    public void GroupByLayers_throws_when_cells_are_null()
    {
        Action act = () => DiagramResourceGroupCellFlowPlanner.GroupByLayers(null!, []);

        act.Should().Throw<ArgumentNullException>().WithParameterName("cells");
    }

    [Fact]
    public void GroupByLayers_throws_when_visible_edges_are_null()
    {
        Action act = () => DiagramResourceGroupCellFlowPlanner.GroupByLayers([], null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("visibleEdges");
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

    [Fact]
    public void OrderCells_seats_cross_group_endpoints_adjacent_when_middle_group_is_unconnected()
    {
        DiagramResourceGroupPacker.ResourceGroupCell cellA = Singleton("a", orderKey: 2, resourceGroup: "rg-a");
        DiagramResourceGroupPacker.ResourceGroupCell cellB = Singleton("b", orderKey: 1, resourceGroup: "rg-b");
        DiagramResourceGroupPacker.ResourceGroupCell cellC = Singleton("c", orderKey: 0, resourceGroup: "rg-c");

        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> ordered =
            DiagramResourceGroupCellFlowPlanner.OrderCells(
                [cellB, cellC, cellA],
                [Edge("a", "c")]);

        IReadOnlyList<string> order = ordered.Select(cell => cell.Nodes.Single().NodeId).ToList();
        int aIndex = order.ToList().IndexOf("a");
        int cIndex = order.ToList().IndexOf("c");

        aIndex.Should().BeOneOf(cIndex - 1, cIndex + 1);
        order.Should().Equal("a", "c", "b");
    }

    [Fact]
    public void OrderCells_keeps_chain_order_for_painted_cross_group_path()
    {
        DiagramResourceGroupPacker.ResourceGroupCell cellA = Singleton("a", orderKey: 2, resourceGroup: "rg-a");
        DiagramResourceGroupPacker.ResourceGroupCell cellB = Singleton("b", orderKey: 1, resourceGroup: "rg-b");
        DiagramResourceGroupPacker.ResourceGroupCell cellC = Singleton("c", orderKey: 0, resourceGroup: "rg-c");

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
    public void OrderCells_ignores_hidden_cross_group_fan_out_edge_for_seating()
    {
        DiagramResourceGroupPacker.ResourceGroupCell cellA = Singleton("a", orderKey: 2, resourceGroup: "rg-a");
        DiagramResourceGroupPacker.ResourceGroupCell cellB = Singleton("b", orderKey: 1, resourceGroup: "rg-b");
        DiagramResourceGroupPacker.ResourceGroupCell cellC = Singleton("c", orderKey: 0, resourceGroup: "rg-c");
        DiagramEdge paintedEdge = Edge("a", "b", "connects");
        DiagramEdge hiddenFanOut = Edge("a", "c", "likely · applies");
        IReadOnlyList<DiagramNode> nodes =
        [
            Node("a", "rg-a"),
            Node("b", "rg-b"),
            Node("c", "rg-c"),
        ];
        IReadOnlyList<DiagramEdge> filteredEdges = DiagramCrossGroupFanOutCanvasExclusion
            .FilterCanvasEdges(nodes, [paintedEdge, hiddenFanOut], includeCrossGroupFanOut: false)
            .ToList();

        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> orderedPaintedOnly =
            DiagramResourceGroupCellFlowPlanner.OrderCells([cellB, cellC, cellA], [paintedEdge]);
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> orderedAfterFilter =
            DiagramResourceGroupCellFlowPlanner.OrderCells([cellB, cellC, cellA], filteredEdges);

        orderedAfterFilter.Select(cell => cell.Nodes.Single().NodeId)
            .Should()
            .Equal(orderedPaintedOnly.Select(cell => cell.Nodes.Single().NodeId));
    }

    private static DiagramResourceGroupPacker.ResourceGroupCell Singleton(
        string nodeId,
        int orderKey,
        string? resourceGroup = null)
    {
        return new DiagramResourceGroupPacker.ResourceGroupCell(resourceGroup, [Node(nodeId, orderKey, resourceGroup)]);
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

    private static DiagramNode Node(string nodeId, string resourceGroup)
    {
        return new DiagramNode
        {
            NodeId = nodeId,
            Label = nodeId,
            NodeType = "TopologyResource",
            ArmResourceGroup = resourceGroup,
            OrderKey = 0,
        };
    }

    private static DiagramEdge Edge(string fromNodeId, string toNodeId, string label = "connects")
    {
        return new DiagramEdge
        {
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            Label = label,
        };
    }
}
