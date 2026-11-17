using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramExecutiveAlwaysShowSelectorTests
{
    [Fact]
    public void Select_overflow_node_label_states_resources_are_not_on_diagram()
    {
        int overflowTrigger = DiagramAstFromGraphCompilerConstants.ExecutiveAlwaysShowTierMaxNodes + 1;
        List<GraphNode> nodes = Enumerable
            .Range(1, overflowTrigger)
            .Select(index => CreateStorageNode($"sa-{index:D2}"))
            .ToList();

        List<GraphNode> selected = DiagramExecutiveAlwaysShowSelector.Select(nodes, hiddenTierKeys: null);
        GraphNode overflow = selected.Should().ContainSingle(node => DiagramExecutiveAlwaysShowSelector.IsOverflowNode(node)).Subject;

        overflow.Label.Should().Contain("not on this diagram");
        overflow.Label.Should().StartWith("+");
    }

    private static GraphNode CreateStorageNode(string name)
    {
        return new GraphNode
        {
            NodeId = name,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = name,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.type"] = "Microsoft.Storage/storageAccounts",
            },
        };
    }
}
