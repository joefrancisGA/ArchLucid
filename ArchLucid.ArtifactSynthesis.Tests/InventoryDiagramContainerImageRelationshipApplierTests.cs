using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class InventoryDiagramContainerImageRelationshipApplierTests
{
    [Fact]
    public void Apply_labels_container_image_edges()
    {
        DiagramAst ast = new()
        {
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "app",
                    ToNodeId = "registry",
                    Label = GraphEdgeTypes.ConnectsTo,
                    InferenceSource = GraphEdgeInferenceSources.InventoryContainerImage,
                    ProvenanceKind = ProvenanceKind.ObservedFact.ToString(),
                },
            ],
        };

        InventoryDiagramContainerImageRelationshipApplier.Apply(ast);

        ast.Edges.Single().Label.Should().Be("Pulls image from");
        ast.Edges.Single().ProvenanceKind.Should().Be(ProvenanceKind.ObservedFact.ToString());
    }
}
