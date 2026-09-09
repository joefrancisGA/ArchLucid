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

        IReadOnlyList<GraphEdge> edges = DeclarationIdentityEdgeMaterializer.MaterializeFromDeclarationActors([actor], [actor]);

        edges.Should().ContainSingle();
        edges[0].FromNodeId.Should().Be("declaration-actor-1");
        edges[0].ToNodeId.Should().Be("obj-ingress-1");
        edges[0].EdgeType.Should().Be(GraphEdgeTypes.RelatesTo);
        edges[0].InferenceSource.Should().Be(GraphEdgeInferenceSources.DeclarationIdentityActorLink);
    }

    [Fact]
    public void MaterializeFromDeclarationActors_uses_canonical_source_node_id_when_declaration_source_property_differs_only_by_case()
    {
        GraphNode topology = new()
        {
            NodeId = "obj-ingress-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "payments-ingress",
        };
        GraphNode actor = new()
        {
            NodeId = "declaration-actor-1",
            NodeType = GraphNodeTypes.Actor,
            Label = "payments-ingress",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["declarationSourceNodeId"] = "OBJ-ingress-1",
            },
        };

        IReadOnlyList<GraphEdge> edges = DeclarationIdentityEdgeMaterializer.MaterializeFromDeclarationActors(
            [actor],
            [topology, actor]);

        edges.Should().ContainSingle();
        edges[0].ToNodeId.Should().Be("obj-ingress-1");
    }
}
