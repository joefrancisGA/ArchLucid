using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramNetworkSecurityPerimeterRelationshipApplierTests
{
    [Fact]
    public void Apply_labels_nsp_association_edges()
    {
        DiagramAst ast = new()
        {
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "nsp",
                    ToNodeId = "storage",
                    Label = GraphEdgeTypes.Protects,
                    InferenceSource = GraphEdgeInferenceSources.InventoryNspAssociation,
                    ProvenanceKind = ProvenanceKind.ObservedFact.ToString(),
                },
            ],
        };

        InventoryDiagramNetworkSecurityPerimeterRelationshipApplier.Apply(ast);

        ast.Edges.Single().Label.Should().Be(InventoryDiagramNetworkSecurityPerimeterRelationshipApplier.Label);
        ast.Edges.Single().ProvenanceKind.Should().Be(ProvenanceKind.DerivedFact.ToString());
    }
}
