using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramKubernetesServiceLoadBalancerRelationshipApplierTests
{
    [Fact]
    public void Apply_labels_inventory_aks_service_load_balancer_edges()
    {
        DiagramAst ast = new()
        {
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "cluster",
                    ToNodeId = "lb",
                    InferenceSource = GraphEdgeInferenceSources.InventoryAksServiceLoadBalancer,
                },
            ],
        };

        InventoryDiagramKubernetesServiceLoadBalancerRelationshipApplier.Apply(ast);

        ast.Edges.Single().Label.Should().Be(InventoryDiagramKubernetesServiceLoadBalancerRelationshipApplier.Label);
    }
}
