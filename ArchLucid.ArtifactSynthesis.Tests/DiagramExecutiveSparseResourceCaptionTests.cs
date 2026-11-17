using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramExecutiveSparseResourceCaptionTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void Compile_executive_sparse_snapshot_adds_first_twelve_resources_caption()
    {
        List<GraphNode> nodes = Enumerable.Range(0, 20)
            .Select(index => CreateTopologyNode($"node-{index}", $"vm-{index}"))
            .ToList();

        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.Empty,
            CreatedUtc = DateTime.UtcNow,
            Nodes = nodes,
            Edges = [],
        };

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);

        ast.CaptionLines.Should().ContainSingle()
            .Which.Should().Be("This view shows the first 12 resources drawn on this diagram from the collected snapshot. It is not a sponsor summary.");
        ast.Nodes.Should().HaveCount(12);
    }

    private static GraphNode CreateTopologyNode(string nodeId, string label)
    {
        string armId =
            $"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.CognitiveServices/accounts/{label}";

        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            Category = "compute",
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] = armId,
                ["arm.type"] = "Microsoft.CognitiveServices/accounts",
                ["arm.resourceGroup"] = "rg",
            },
        };
    }
}
