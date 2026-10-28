using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramAstGraphNodeClassifierTests
{
    [Fact]
    public void TryReadStoredArmType_returns_false_when_only_node_type_is_present()
    {
        GraphNode node = new()
        {
            NodeId = "node-1",
            NodeType = GraphNodeTypes.TopologyResource,
        };

        DiagramAstGraphNodeClassifier.TryReadStoredArmType(node, out string armType).Should().BeFalse();
        armType.Should().BeEmpty();
        DiagramAstGraphNodeClassifier.ReadArmType(node).Should().Be(GraphNodeTypes.TopologyResource);
    }

    [Fact]
    public void TryReadStoredArmId_returns_false_when_only_source_id_is_present()
    {
        GraphNode node = new()
        {
            NodeId = "internal-node-id",
            SourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1",
            Properties = [],
        };

        DiagramAstGraphNodeClassifier.TryReadStoredArmId(node, out string armId).Should().BeFalse();
        armId.Should().BeEmpty();
        DiagramAstGraphNodeClassifier.ReadArmId(node).Should().Be(node.SourceId);
    }
}
