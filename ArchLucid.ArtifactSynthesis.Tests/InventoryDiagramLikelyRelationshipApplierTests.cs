using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class InventoryDiagramLikelyRelationshipApplierTests
{
    [Fact]
    public void Apply_marks_inferred_data_factory_edge_as_likely_and_explains_it()
    {
        DiagramAst ast = CreateAst(
            GraphEdgeInferenceSources.InventoryAdfLinkedServiceInferred,
            ProvenanceKind.DeterministicInference.ToString());

        InventoryDiagramLikelyRelationshipApplier.Apply(ast);

        DiagramEdge edge = ast.Edges.Single();
        edge.Label.Should().Be(InventoryDiagramLikelyRelationshipApplier.OutlineSentence);
        edge.ProvenanceKind.Should().Be(ProvenanceKind.DeterministicInference.ToString());
        ast.Nodes[0].UnresolvedRelationshipDetails.Should()
            .Contain(InventoryDiagramLikelyRelationshipApplier.OutlineSentence);
    }

    [Fact]
    public void Apply_marks_deterministically_inferred_app_key_vault_edge_as_likely()
    {
        DiagramAst ast = CreateAst(
            GraphEdgeInferenceSources.InventoryAppKeyVaultRef,
            ProvenanceKind.DeterministicInference.ToString());

        InventoryDiagramLikelyRelationshipApplier.Apply(ast);

        ast.Edges.Single().Label.Should().Be(InventoryDiagramLikelyRelationshipApplier.OutlineSentence);
    }

    [Fact]
    public void Apply_keeps_collected_app_key_vault_edge_solid()
    {
        DiagramAst ast = CreateAst(
            GraphEdgeInferenceSources.InventoryAppKeyVaultRef,
            ProvenanceKind.DerivedFact.ToString());

        InventoryDiagramLikelyRelationshipApplier.Apply(ast);

        ast.Edges.Single().Label.Should().NotBe(InventoryDiagramLikelyRelationshipApplier.OutlineSentence);
        ast.Nodes[0].UnresolvedRelationshipDetails.Should().BeEmpty();
    }

    private static DiagramAst CreateAst(string inferenceSource, string provenanceKind)
    {
        return new DiagramAst
        {
            Nodes =
            [
                new DiagramNode { NodeId = "source", Label = "source" },
                new DiagramNode { NodeId = "target", Label = "target" },
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "source",
                    ToNodeId = "target",
                    Label = "Connected",
                    InferenceSource = inferenceSource,
                    ProvenanceKind = provenanceKind,
                },
            ],
        };
    }
}
