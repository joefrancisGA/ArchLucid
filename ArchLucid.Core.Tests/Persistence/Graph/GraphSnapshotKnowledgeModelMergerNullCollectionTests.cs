using System.Text;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Graph;
using ArchLucid.Core.Persistence.Serialization;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Persistence.Graph;

[Trait("Category", "Unit")]
public sealed class GraphSnapshotKnowledgeModelMergerNullCollectionTests
{
    [Fact]
    public void Merge_treats_null_warnings_as_empty()
    {
        GraphSnapshot contextGraph = new() { Warnings = null! };

        GraphSnapshot modelGraph = new()
        {
            GraphSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Warnings = null!,
        };

        GraphSnapshot merged = GraphSnapshotKnowledgeModelMerger.Merge(contextGraph, modelGraph);

        merged.Warnings.Should().NotBeNull();
        merged.Warnings.Should().BeEmpty();
    }

    [Fact]
    public void Merge_treats_null_node_and_edge_lists_as_empty()
    {
        GraphSnapshot contextGraph = new() { Nodes = null!, Edges = null! };

        GraphSnapshot modelGraph = new()
        {
            GraphSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Nodes = null!,
            Edges = null!,
        };

        GraphSnapshot merged = GraphSnapshotKnowledgeModelMerger.Merge(contextGraph, modelGraph);

        merged.Nodes.Should().NotBeNull();
        merged.Nodes.Should().BeEmpty();
        merged.Edges.Should().NotBeNull();
        merged.Edges.Should().BeEmpty();
    }

    [Fact]
    public void Merge_succeeds_when_snapshot_projection_json_has_null_collection_properties()
    {
        GraphSnapshot? deserialized = GraphJsonSerialization.DeserializeSnapshot(
            Encoding.UTF8.GetBytes("{\"nodes\":null,\"edges\":null,\"warnings\":null}"));

        deserialized.Should().NotBeNull();
        deserialized!.Nodes.Should().BeNull();
        deserialized.Edges.Should().BeNull();
        deserialized.Warnings.Should().BeNull();

        GraphSnapshot modelGraph = new()
        {
            GraphSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        };

        GraphSnapshot merged = GraphSnapshotKnowledgeModelMerger.Merge(deserialized, modelGraph);

        merged.Nodes.Should().BeEmpty();
        merged.Edges.Should().BeEmpty();
        merged.Warnings.Should().BeEmpty();
    }

    [Fact]
    public void Merge_treats_null_edge_type_as_empty_when_canonicalizing_model_edges()
    {
        GraphSnapshot contextGraph = new() { Nodes = [], Edges = [] };

        GraphSnapshot modelGraph = new()
        {
            GraphSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Nodes =
            [
                new GraphNode { NodeId = "shared", NodeType = "model", Label = "model-shared" },
                new GraphNode { NodeId = "target", NodeType = "model", Label = "model-target" },
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "e-null-type",
                    FromNodeId = "shared",
                    ToNodeId = "target",
                    EdgeType = null!,
                },
            ],
        };

        GraphSnapshot merged = GraphSnapshotKnowledgeModelMerger.Merge(contextGraph, modelGraph);

        merged.Edges.Should().ContainSingle();
        merged.Edges[0].EdgeType.Should().BeEmpty();
    }

    [Fact]
    public void Merge_treats_null_model_node_id_as_empty_when_deduplicating_nodes()
    {
        GraphSnapshot contextGraph = new() { Nodes = [], Edges = [] };

        GraphSnapshot modelGraph = new()
        {
            GraphSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Nodes =
            [
                new GraphNode { NodeId = null!, NodeType = "model", Label = "missing-id" },
            ],
        };

        GraphSnapshot merged = GraphSnapshotKnowledgeModelMerger.Merge(contextGraph, modelGraph);

        merged.Nodes.Should().ContainSingle();
        merged.Nodes[0].NodeId.Should().BeEmpty();
    }

    [Fact]
    public void Merge_treats_null_edge_endpoint_ids_as_empty_when_canonicalizing_model_edges()
    {
        GraphSnapshot contextGraph = new() { Nodes = [], Edges = [] };

        GraphSnapshot modelGraph = new()
        {
            GraphSnapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Nodes =
            [
                new GraphNode { NodeId = "a", NodeType = "model", Label = "a" },
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "e-null-endpoints",
                    FromNodeId = null!,
                    ToNodeId = null!,
                    EdgeType = "dependsOn",
                },
            ],
        };

        GraphSnapshot merged = GraphSnapshotKnowledgeModelMerger.Merge(contextGraph, modelGraph);

        merged.Edges.Should().ContainSingle();
        merged.Edges[0].FromNodeId.Should().BeEmpty();
        merged.Edges[0].ToNodeId.Should().BeEmpty();
    }
}
