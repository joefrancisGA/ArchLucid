using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramMonitorPrivateLinkScopeRelationshipApplierTests
{
    [Fact]
    public void Apply_labels_ampls_scoped_resource_edges()
    {
        DiagramAst ast = new()
        {
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "ampls",
                    ToNodeId = "appinsights",
                    Label = GraphEdgeTypes.ConnectsTo,
                    InferenceSource = GraphEdgeInferenceSources.InventoryAmplsScopedResource,
                    ProvenanceKind = ProvenanceKind.ObservedFact.ToString(),
                },
            ],
        };

        InventoryDiagramMonitorPrivateLinkScopeRelationshipApplier.Apply(ast);

        ast.Edges.Single().Label.Should().Be(InventoryDiagramMonitorPrivateLinkScopeRelationshipApplier.Label);
        ast.Edges.Single().ProvenanceKind.Should().Be(ProvenanceKind.DerivedFact.ToString());
    }
}
