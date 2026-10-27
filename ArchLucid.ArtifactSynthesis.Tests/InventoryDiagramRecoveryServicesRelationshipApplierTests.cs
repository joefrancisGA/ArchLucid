using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "ArtifactSynthesis")]
public sealed class InventoryDiagramRecoveryServicesRelationshipApplierTests
{
    [Fact]
    public void Apply_labels_replicate_edge_with_target_region()
    {
        DiagramAst ast = new()
        {
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "vault",
                    ToNodeId = "vm",
                    Label = AzureInventoryRecoveryServices.ReplicateEdgeLabel,
                    InferenceSource = GraphEdgeInferenceSources.InventoryRecoveryServicesReplicates,
                },
            ],
        };

        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.Empty,
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                new GraphNode { NodeId = "vault-node", NodeType = GraphNodeTypes.TopologyResource, Label = "vault" },
                new GraphNode { NodeId = "vm-node", NodeType = GraphNodeTypes.TopologyResource, Label = "vm" },
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "edge-1",
                    FromNodeId = "vault-node",
                    ToNodeId = "vm-node",
                    EdgeType = GraphEdgeTypes.Protects,
                    InferenceSource = GraphEdgeInferenceSources.InventoryRecoveryServicesReplicates,
                    Properties =
                    {
                        [AzureInventoryRecoveryServices.EdgeTargetRegionPropertyKey] = "West US 2",
                    },
                },
            ],
        };

        Dictionary<string, string> map = new(StringComparer.Ordinal)
        {
            ["vault-node"] = "vault",
            ["vm-node"] = "vm",
        };

        InventoryDiagramRecoveryServicesRelationshipApplier.Apply(ast, graph, map);

        ast.Edges.Single().Label.Should()
            .Be(InventoryDiagramRelationshipLabelTexts.FormatRecoveryServicesReplicatesLabel("West US 2"));
    }

    [Fact]
    public void Apply_labels_replicate_edge_when_target_region_missing()
    {
        DiagramAst ast = new()
        {
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "vault",
                    ToNodeId = "vm",
                    Label = AzureInventoryRecoveryServices.ReplicateEdgeLabel,
                    InferenceSource = GraphEdgeInferenceSources.InventoryRecoveryServicesReplicates,
                },
            ],
        };

        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.Empty,
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                new GraphNode { NodeId = "vault-node", NodeType = GraphNodeTypes.TopologyResource, Label = "vault" },
                new GraphNode { NodeId = "vm-node", NodeType = GraphNodeTypes.TopologyResource, Label = "vm" },
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "edge-1",
                    FromNodeId = "vault-node",
                    ToNodeId = "vm-node",
                    EdgeType = GraphEdgeTypes.Protects,
                    InferenceSource = GraphEdgeInferenceSources.InventoryRecoveryServicesReplicates,
                },
            ],
        };

        Dictionary<string, string> map = new(StringComparer.Ordinal)
        {
            ["vault-node"] = "vault",
            ["vm-node"] = "vm",
        };

        InventoryDiagramRecoveryServicesRelationshipApplier.Apply(ast, graph, map);

        DiagramEdge edge = ast.Edges.Single();
        edge.Label.Should()
            .Be(InventoryDiagramRelationshipLabelTexts.FormatRecoveryServicesReplicatesLabel(null));
        edge.ProvenanceKind.Should().Be(ProvenanceKind.ObservedFact.ToString());
    }

    [Fact]
    public void Apply_labels_protects_edge_with_backup_label()
    {
        DiagramAst ast = new()
        {
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "vault",
                    ToNodeId = "vm",
                    Label = "Provenance was not stored.",
                    InferenceSource = GraphEdgeInferenceSources.InventoryRecoveryServicesProtects,
                    ProvenanceKind = "Unclassified",
                },
            ],
        };

        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.Empty,
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                new GraphNode { NodeId = "vault-node", NodeType = GraphNodeTypes.TopologyResource, Label = "vault" },
                new GraphNode { NodeId = "vm-node", NodeType = GraphNodeTypes.TopologyResource, Label = "vm" },
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "edge-1",
                    FromNodeId = "vault-node",
                    ToNodeId = "vm-node",
                    EdgeType = GraphEdgeTypes.Protects,
                    InferenceSource = GraphEdgeInferenceSources.InventoryRecoveryServicesProtects,
                },
            ],
        };

        Dictionary<string, string> map = new(StringComparer.Ordinal)
        {
            ["vault-node"] = "vault",
            ["vm-node"] = "vm",
        };

        InventoryDiagramRecoveryServicesRelationshipApplier.Apply(ast, graph, map);

        DiagramEdge edge = ast.Edges.Single();
        edge.Label.Should().Be(InventoryDiagramRelationshipLabelTexts.FormatRecoveryServicesProtectsLabel());
        edge.ProvenanceKind.Should().Be(ProvenanceKind.ObservedFact.ToString());
    }
}
