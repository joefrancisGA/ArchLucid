using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GraphSnapshotStorageMapperTests
{
    private static GraphSnapshotStorageRow MakeRow(
        List<GraphNode>? nodes = null,
        List<GraphEdge>? edges = null,
        List<string>? warnings = null)
    {
        return new GraphSnapshotStorageRow
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            NodesJson = JsonEntitySerializer.Serialize(nodes ?? []),
            EdgesJson = JsonEntitySerializer.Serialize(edges ?? []),
            WarningsJson = JsonEntitySerializer.Serialize(warnings ?? []),
        };
    }

    [Fact]
    public void ToSnapshot_throws_for_null_row()
    {
        Action act = () => GraphSnapshotStorageMapper.ToSnapshot(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void ToSnapshot_deserializes_json_columns_into_snapshot_collections()
    {
        GraphNode node = new() { NodeId = "n1", NodeType = "TopologyResource", Label = "vm-1" };
        GraphEdge edge = new() { EdgeId = "e1", FromNodeId = "n1", ToNodeId = "n2", EdgeType = "CONTAINS" };

        GraphSnapshotStorageRow row = MakeRow(nodes: [node], edges: [edge], warnings: ["low-confidence"]);

        GraphSnapshot snapshot = GraphSnapshotStorageMapper.ToSnapshot(row);

        snapshot.GraphSnapshotId.Should().Be(row.GraphSnapshotId);
        snapshot.ContextSnapshotId.Should().Be(row.ContextSnapshotId);
        snapshot.RunId.Should().Be(row.RunId);
        snapshot.CreatedUtc.Should().Be(row.CreatedUtc);
        snapshot.Nodes.Should().ContainSingle().Which.NodeId.Should().Be("n1");
        snapshot.Edges.Should().ContainSingle().Which.EdgeId.Should().Be("e1");
        snapshot.Warnings.Should().ContainSingle().Which.Should().Be("low-confidence");
    }

    [Fact]
    public void ToSnapshot_wraps_corrupt_json_in_invalid_operation_exception()
    {
        GraphSnapshotStorageRow row = MakeRow();
        row = new GraphSnapshotStorageRow
        {
            GraphSnapshotId = row.GraphSnapshotId,
            ContextSnapshotId = row.ContextSnapshotId,
            RunId = row.RunId,
            CreatedUtc = row.CreatedUtc,
            NodesJson = "not-json",
            EdgesJson = row.EdgesJson,
            WarningsJson = row.WarningsJson,
        };

        Action act = () => GraphSnapshotStorageMapper.ToSnapshot(row);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage($"*{row.GraphSnapshotId}*");
    }

    [Fact]
    public void ToSnapshot_with_overrides_throws_for_null_row()
    {
        Action act = () => GraphSnapshotStorageMapper.ToSnapshot(null!, null, null, null);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void ToSnapshot_with_overrides_uses_relational_collections_when_provided()
    {
        GraphSnapshotStorageRow row = MakeRow();
        List<GraphNode> nodesOverride = [new GraphNode { NodeId = "n1", NodeType = "TopologyResource", Label = "vm-1" }];
        List<GraphEdge> edgesOverride =
            [new GraphEdge { EdgeId = "e1", FromNodeId = "n1", ToNodeId = "n2", EdgeType = "CONTAINS" }];
        List<string> warningsOverride = ["warn-1"];

        GraphSnapshot snapshot =
            GraphSnapshotStorageMapper.ToSnapshot(row, nodesOverride, edgesOverride, warningsOverride);

        snapshot.Nodes.Should().ContainSingle().Which.NodeId.Should().Be("n1");
        snapshot.Edges.Should().ContainSingle().Which.EdgeId.Should().Be("e1");
        snapshot.Warnings.Should().ContainSingle().Which.Should().Be("warn-1");
    }

    [Fact]
    public void ToSnapshot_with_overrides_leaves_collections_empty_when_overrides_are_null()
    {
        GraphSnapshotStorageRow row = MakeRow();

        GraphSnapshot snapshot = GraphSnapshotStorageMapper.ToSnapshot(row, null, null, null);

        snapshot.Nodes.Should().BeEmpty();
        snapshot.Edges.Should().BeEmpty();
        snapshot.Warnings.Should().BeEmpty();
    }
}
