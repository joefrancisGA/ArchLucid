using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramNodePoolRelationshipApplierTests
{
    [Fact]
    public void Apply_labels_inventory_node_pool_edges()
    {
        DiagramAst ast = new()
        {
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "vmss",
                    ToNodeId = "cluster",
                    InferenceSource = GraphEdgeInferenceSources.InventoryNodePool,
                },
            ],
        };

        InventoryDiagramNodePoolRelationshipApplier.Apply(ast);

        DiagramEdge edge = ast.Edges.Single();
        edge.Label.Should().Be(InventoryDiagramNodePoolRelationshipApplier.Label);
        edge.ProvenanceKind.Should().Be(ProvenanceKind.DeterministicInference.ToString());
    }
}
