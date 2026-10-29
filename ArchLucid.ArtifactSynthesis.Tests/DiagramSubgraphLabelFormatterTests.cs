using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DiagramSubgraphLabelFormatterTests
{
    [Fact]
    public void FormatForDiagram_distinguishes_null_whitespace_and_labels()
    {
        DiagramSubgraphLabelFormatter.FormatForDiagram(null)
            .Should()
            .Be(DiagramSubgraphLabelFormatter.GroupLabelNotStoredCaption);
        DiagramSubgraphLabelFormatter.FormatForDiagram(" ")
            .Should()
            .Be(DiagramSubgraphLabelFormatter.GroupLabelStoredEmptyCaption);
        DiagramSubgraphLabelFormatter.FormatForDiagram("Production")
            .Should()
            .Be("Production");
    }

    [Fact]
    public void MermaidDiagramRenderer_emits_stored_empty_group_label()
    {
        DiagramAst ast = new()
        {
            Title = "group-label",
            Nodes =
            [
                new DiagramNode { NodeId = "n1", Label = "n1", NodeType = "vnet", SubgraphId = "g1" },
            ],
            Subgraphs =
            [
                new DiagramSubgraph { SubgraphId = "g1", Label = " ", OrderKey = 0 },
            ],
        };

        string mermaid = new MermaidDiagramRenderer().Render(ast);

        mermaid.Should().Contain(DiagramSubgraphLabelFormatter.GroupLabelStoredEmptyCaption);
    }

    [Fact]
    public void FormatForDiagram_rollup_null_label_uses_not_stored_caption()
    {
        DiagramSubgraphLabelFormatter.FormatForDiagram(null)
            .Should()
            .Be(DiagramSubgraphLabelFormatter.GroupLabelNotStoredCaption);
    }
}
