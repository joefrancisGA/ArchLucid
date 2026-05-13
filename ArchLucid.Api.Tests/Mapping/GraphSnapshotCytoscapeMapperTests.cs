using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models.Graph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Mapping;

[Trait("Category", "Unit")]
[Trait("Suite", "Http")]
public sealed class GraphSnapshotCytoscapeMapperTests
{
    [Fact]
    public void ToInteractiveResponse_maps_nodes_and_edges_with_ids()
    {
        Guid snapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid runId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        GraphSnapshot snap = new()
        {
            GraphSnapshotId = snapshotId,
            RunId = runId,
            ContextSnapshotId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-1",
                    NodeType = "Service",
                    Label = "Payments",
                    SourceId = "src",
                    Category = "api",
                    Properties =
                    {
                        ["env"] = "prod",
                    },
                },
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "e1",
                    FromNodeId = "svc-1",
                    ToNodeId = "svc-2",
                    EdgeType = "Calls",
                    Label = "HTTPS",
                    Weight = 1d,
                },
            ],
        };

        CytoscapeInteractiveGraphResponse response = GraphSnapshotCytoscapeMapper.ToInteractiveResponse(snap);

        response.GraphSnapshotId.Should().Be(snapshotId);
        response.RunId.Should().Be(runId);
        response.Elements.Nodes.Should().HaveCount(1);
        response.Elements.Nodes[0].Data.Id.Should().Be("svc-1");
        response.Elements.Nodes[0].Data.NodeType.Should().Be("Service");
        response.Elements.Edges.Should().HaveCount(1);
        response.Elements.Edges[0].Data.Id.Should().Be("e1");
        response.Elements.Edges[0].Data.Source.Should().Be("svc-1");
        response.Elements.Edges[0].Data.Target.Should().Be("svc-2");
        response.Elements.Edges[0].Data.Label.Should().Be("HTTPS");
    }
}
