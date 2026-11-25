using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Pagination;

[Trait("Category", "Unit")]
public sealed class GraphSnapshotPaginationTests
{
    [Fact]
    public void CreatePage_SecondPage_PreservesNodeOrderAndKeepsOnlyEdgesWithBothEndpointsOnPage()
    {
        GraphSnapshot snapshot = new()
        {
            Nodes =
            [
                new GraphNode { NodeId = "z" }, new GraphNode { NodeId = "a" },
                new GraphNode { NodeId = "y" }, new GraphNode { NodeId = "b" },
                new GraphNode { NodeId = "x" },
            ],
            Edges =
            [
                new GraphEdge { EdgeId = "incoming", FromNodeId = "z", ToNodeId = "y" },
                new GraphEdge { EdgeId = "inside", FromNodeId = "y", ToNodeId = "b" },
                new GraphEdge { EdgeId = "outgoing", FromNodeId = "b", ToNodeId = "x" },
                new GraphEdge { EdgeId = "outside", FromNodeId = "z", ToNodeId = "a" },
            ],
        };

        GraphSnapshotNodesPage page = GraphSnapshotPagination.CreatePage(snapshot, 2, 2);

        page.Nodes.Select(static node => node.NodeId).Should().Equal("y", "b");
        page.Edges.Select(static edge => edge.EdgeId).Should().Equal("inside");
        page.Page.Should().Be(2);
        page.PageSize.Should().Be(2);
        page.TotalNodes.Should().Be(5);
        page.HasMore.Should().BeTrue();
    }

    [Fact]
    public void CreatePage_ExtremePage_DoesNotReportMoreNodes()
    {
        GraphSnapshot snapshot = new()
        {
            Nodes = [new GraphNode { NodeId = "n1", NodeType = "Service", Label = "Node" }]
        };

        GraphSnapshotNodesPage page = GraphSnapshotPagination.CreatePage(snapshot, int.MaxValue, 200);

        page.Nodes.Should().BeEmpty();
        page.HasMore.Should().BeFalse();
    }
}
