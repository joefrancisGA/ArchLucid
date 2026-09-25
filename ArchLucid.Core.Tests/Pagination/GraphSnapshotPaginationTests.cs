using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Pagination;

[Trait("Category", "Unit")]
public sealed class GraphSnapshotPaginationTests
{
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
