using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class MermaidDiagramRenderPipelineTests
{
    private readonly MermaidDiagramRenderPipeline pipeline = new(
        new MermaidDiagramRenderer(),
        new MermaidDiagramComplexityAnalyzer(),
        new MermaidDiagramDeterministicRepairer(),
        new MermaidDiagramStructuralValidator(),
        new MermaidDiagramSemanticIntegrityGuard(),
        new MermaidDiagramFallbackSetBuilder(
            new Compilers.DiagramAstFromGraphCompiler(),
            new MermaidDiagramRenderer(),
            new MermaidDiagramComplexityAnalyzer(),
            new MermaidDiagramDeterministicRepairer(),
            new MermaidDiagramStructuralValidator()));

    [Fact]
    public async Task RenderAsync_collapses_duplicate_edges_during_deterministic_repair()
    {
        DiagramAst ast = new()
        {
            Title = "dup-edges",
            Nodes =
            [
                new DiagramNode { NodeId = "a", Label = "A", NodeType = "Service" },
                new DiagramNode { NodeId = "b", Label = "B", NodeType = "Service" },
            ],
            Edges =
            [
                new DiagramEdge { FromNodeId = "a", ToNodeId = "b", Label = "link" },
                new DiagramEdge { FromNodeId = "a", ToNodeId = "b", Label = "link" },
            ],
        };

        MermaidDiagramRenderResult result = await pipeline.RenderAsync(new MermaidDiagramRenderRequest { Ast = ast });

        result.Status.Should().Be(MermaidDiagramRenderStatus.Succeeded);
        result.CollapseReport!.Entries.Should().Contain(entry => entry.Kind == "DuplicateEdge");
        result.PrimaryMermaid!.Split("-->", StringSplitOptions.None).Length.Should().Be(2);
    }

    [Fact]
    public async Task RenderAsync_over_threshold_graph_returns_partitioned_not_succeeded()
    {
        DiagramAst ast = BuildLargeAst(nodeCount: 500);

        MermaidDiagramRenderResult result = await pipeline.RenderAsync(new MermaidDiagramRenderRequest
        {
            Ast = ast,
            Thresholds = new MermaidDiagramReadabilityThresholds { MaxNodes = 400 },
        });

        result.Status.Should().Be(MermaidDiagramRenderStatus.Partitioned);
        result.Status.Should().NotBe(MermaidDiagramRenderStatus.Succeeded);
        result.Metrics.NodeCount.Should().Be(500);
    }

    [Fact]
    public void SemanticIntegrityGuard_rejects_ai_repair_dropping_required_cloud_resource()
    {
        Guid requiredResourceId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        DiagramAst original = new()
        {
            Title = "guard",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "required-node",
                    Label = "Required",
                    NodeType = "TopologyResource",
                    CloudResourceId = requiredResourceId,
                },
            ],
        };

        DiagramAst aiRepaired = new()
        {
            Title = "guard",
            Nodes = [],
        };

        MermaidDiagramSemanticIntegrityGuard guard = new();
        bool valid = guard.TryValidateRepair(original, aiRepaired, [requiredResourceId], out MermaidDiagramCollapseReport collapse);

        valid.Should().BeFalse();
        collapse.Entries.Should().Contain(entry => entry.Kind == "RequiredCloudResourceDropped");
    }

    private static DiagramAst BuildLargeAst(int nodeCount)
    {
        DiagramAst ast = new() { Title = "large" };

        for (int index = 0; index < nodeCount; index++)
        {
            ast.Nodes.Add(new DiagramNode
            {
                NodeId = $"node-{index}",
                Label = $"Resource {index}",
                NodeType = "TopologyResource",
                OrderKey = index,
            });
        }

        return ast;
    }
}
