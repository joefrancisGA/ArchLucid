using ArchLucid.Contracts.Architecture;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Materialization;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DeclarationIdentityEdgeMaterializerTests
{
    [Fact]
    public void MaterializeFromDeclarationActors_links_actor_to_declaration_source_node()
    {
        GraphNode actor = new()
        {
            NodeId = "declaration-actor-1",
            NodeType = GraphNodeTypes.Actor,
            Label = "payments-ingress",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["declarationSourceNodeId"] = "obj-ingress-1",
            },
        };

        IReadOnlyList<GraphEdge> edges = DeclarationIdentityEdgeMaterializer.MaterializeFromDeclarationActors([actor]);

        edges.Should().ContainSingle();
        edges[0].FromNodeId.Should().Be("declaration-actor-1");
        edges[0].ToNodeId.Should().Be("obj-ingress-1");
        edges[0].EdgeType.Should().Be(GraphEdgeTypes.RelatesTo);
        edges[0].InferenceSource.Should().Be(GraphEdgeInferenceSources.DeclarationIdentityActorLink);
    }
}
