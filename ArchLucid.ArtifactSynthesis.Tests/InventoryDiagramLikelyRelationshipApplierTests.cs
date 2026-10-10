using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
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

    [Fact]
    public void Apply_marks_redacted_storage_host_edge_as_likely()
    {
        DiagramAst ast = new()
        {
            Nodes =
            [
                new DiagramNode { NodeId = "app", Label = "app" },
                new DiagramNode
                {
                    NodeId = "storage",
                    Label = "storage",
                    ArmResourceType = "Microsoft.Storage/storageAccounts",
                },
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "app",
                    ToNodeId = "storage",
                    Label = "Connected",
                    InferenceSource = GraphEdgeInferenceSources.InventoryStorageHostRef,
                    ProvenanceKind = ProvenanceKind.DeterministicInference.ToString(),
                },
            ],
        };

        InventoryDiagramLikelyRelationshipApplier.Apply(ast);

        ast.Edges.Should().ContainSingle();
        ast.Edges.Single().Label.Should().Be("Likely");
        ast.Nodes[0].UnresolvedRelationshipDetails.Should()
            .Contain(InventoryDiagramLikelyRelationshipApplier.StorageHostOutlineSentence);
    }

    [Fact]
    public void Apply_removes_storage_host_guess_when_solid_edge_exists()
    {
        DiagramAst ast = new()
        {
            Nodes =
            [
                new DiagramNode { NodeId = "app", Label = "app" },
                new DiagramNode
                {
                    NodeId = "storage",
                    Label = "storage",
                    ArmResourceType = "Microsoft.Storage/storageAccounts",
                },
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "app",
                    ToNodeId = "storage",
                    Label = "Likely",
                    InferenceSource = GraphEdgeInferenceSources.InventoryStorageHostRef,
                    ProvenanceKind = ProvenanceKind.DeterministicInference.ToString(),
                },
                new DiagramEdge
                {
                    FromNodeId = "app",
                    ToNodeId = "storage",
                    Label = "Connected",
                    InferenceSource = GraphEdgeInferenceSources.InventoryAdfLinkedService,
                    ProvenanceKind = ProvenanceKind.ObservedFact.ToString(),
                },
            ],
        };

        InventoryDiagramLikelyRelationshipApplier.Apply(ast);

        ast.Edges.Should().ContainSingle(edge => edge.Label == "Connected");
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
