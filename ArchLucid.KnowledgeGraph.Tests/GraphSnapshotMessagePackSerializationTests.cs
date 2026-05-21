using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.KnowledgeGraph.Serialization;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Category", "Unit")]
public sealed class GraphSnapshotMessagePackSerializationTests
{
    [Fact]
    public void RoundTrip_preserves_projection_fields()
    {
        GraphSnapshot snapshot = new()
        {
            GraphSnapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
            ContextSnapshotId = Guid.Parse("11111111-2222-3333-4444-555555555555"),
            RunId = Guid.Parse("99999999-8888-7777-6666-555555555555"),
            CreatedUtc = new DateTime(2026, 5, 21, 12, 0, 0, DateTimeKind.Utc),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "n1",
                    NodeType = "Service",
                    Label = "api",
                    Properties = new Dictionary<string, string> { ["tier"] = "web" },
                },
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "e1",
                    FromNodeId = "n1",
                    ToNodeId = "n2",
                    EdgeType = "DependsOn",
                },
            ],
            Warnings = ["sample"],
        };

        byte[] bytes = GraphSnapshotMessagePackSerialization.SerializeSnapshot(snapshot);
        GraphSnapshot? roundTrip = GraphSnapshotMessagePackSerialization.DeserializeSnapshot(bytes);

        roundTrip.Should().NotBeNull();
        roundTrip!.GraphSnapshotId.Should().Be(snapshot.GraphSnapshotId);
        roundTrip.Nodes.Should().HaveCount(1);
        roundTrip.Nodes[0].Label.Should().Be("api");
        roundTrip.Edges.Should().HaveCount(1);
        roundTrip.Warnings.Should().Contain("sample");
    }
}
