using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramArmParentChildEdgeHydratorTests
{
    [Fact]
    public void Apply_marks_nested_contains_edges_as_derived_fact()
    {
        const string parentArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1";
        const string childArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/app";

        DiagramAst ast = new()
        {
            Nodes =
            [
                new DiagramNode { NodeId = "vnet", SeedNodeId = "graph-vnet" },
                new DiagramNode { NodeId = "subnet", SeedNodeId = "graph-subnet" },
            ],
        };

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "graph-vnet",
                    Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        ["arm.id"] = parentArmId,
                        ["arm.type"] = "Microsoft.Network/virtualNetworks",
                    },
                },
                new GraphNode
                {
                    NodeId = "graph-subnet",
                    Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        ["arm.id"] = childArmId,
                        ["arm.type"] = "Microsoft.Network/virtualNetworks/subnets",
                    },
                },
            ],
        };

        Dictionary<string, string> map = new(StringComparer.Ordinal)
        {
            ["graph-vnet"] = "vnet",
            ["graph-subnet"] = "subnet",
        };

        DiagramArmParentChildEdgeHydrator.Apply(ast, graph, map);

        DiagramEdge edge = ast.Edges.Should().ContainSingle().Subject;
        edge.ProvenanceKind.Should().Be(ProvenanceKind.DerivedFact.ToString());
        edge.InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryExplicitParentChild);
    }
}
