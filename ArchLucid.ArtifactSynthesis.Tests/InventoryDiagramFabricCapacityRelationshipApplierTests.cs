using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramFabricCapacityRelationshipApplierTests
{
    [Fact]
    public void Apply_labels_fabric_capacity_workspace_edges()
    {
        DiagramAst ast = new()
        {
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "capacity",
                    ToNodeId = "workspace",
                    Label = GraphEdgeTypes.ConnectsTo,
                    InferenceSource = GraphEdgeInferenceSources.InventoryFabricCapacityWorkspace,
                    ProvenanceKind = ProvenanceKind.ObservedFact.ToString(),
                },
            ],
        };

        InventoryDiagramFabricCapacityRelationshipApplier.Apply(ast);

        ast.Edges.Single().Label.Should().Be(InventoryDiagramFabricCapacityRelationshipApplier.Label);
    }
}
