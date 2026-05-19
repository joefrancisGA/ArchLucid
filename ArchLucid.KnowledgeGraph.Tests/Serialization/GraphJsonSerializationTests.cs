using System.Text.Json;

using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.KnowledgeGraph.Serialization;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests.Serialization;

public sealed class GraphJsonSerializationTests
{
    [Fact]
    public void SerializeSnapshotToUtf8Bytes_round_trips_full_snapshot_with_canonical_node_shape()
    {
        GraphSnapshot original = new()
        {
            SchemaVersion = 1,
            GraphSnapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
            ContextSnapshotId = Guid.Parse("11111111-2222-3333-4444-555555555555"),
            RunId = Guid.Parse("22222222-3333-4444-5555-666666666666"),
            CreatedUtc = new DateTime(2026, 5, 19, 12, 0, 0, DateTimeKind.Utc),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "n1",
                    NodeType = "svc",
                    Label = "API",
                    Category = null,
                    SourceType = null,
                    SourceId = null,
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) { ["k"] = "v" }
                }
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "e1",
                    FromNodeId = "n1",
                    ToNodeId = "n2",
                    EdgeType = "calls",
                    Label = null,
                    Properties = []
                }
            ],
            Warnings = ["warn"]
        };

        byte[] utf8 = GraphJsonSerialization.SerializeSnapshotToUtf8Bytes(original);
        GraphSnapshot? roundTrip = GraphJsonSerialization.DeserializeSnapshot(utf8);

        roundTrip.Should().BeEquivalentTo(original);
        JsonSerializer.Serialize(original.Nodes[0], GraphJsonSerialization.EntityJsonOptions)
            .Should()
            .Contain("\"category\":null");
    }

    [Fact]
    public void EntityJsonOptions_list_round_trip_matches_persistence_contract()
    {
        List<GraphNode> nodes =
        [
            new GraphNode
            {
                NodeId = "a",
                NodeType = "b",
                Label = "c",
                Properties = []
            }
        ];

        string json = JsonSerializer.Serialize(nodes, GraphJsonSerialization.EntityJsonOptions);
        List<GraphNode>? back = JsonSerializer.Deserialize<List<GraphNode>>(json, GraphJsonSerialization.EntityJsonOptions);

        back.Should().BeEquivalentTo(nodes);
    }
}
