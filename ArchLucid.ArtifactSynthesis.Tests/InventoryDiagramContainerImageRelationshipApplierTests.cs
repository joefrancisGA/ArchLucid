using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
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

        ast.Edges.Single().Label.Should().Be(InventoryDiagramRelationshipLabelTexts.ImageReferenceStoredImagePullNotObserved);
        ast.Edges.Single().ProvenanceKind.Should().Be(ProvenanceKind.DerivedFact.ToString());
    }
}
