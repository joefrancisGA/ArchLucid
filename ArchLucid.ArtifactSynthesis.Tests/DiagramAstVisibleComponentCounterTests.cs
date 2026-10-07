using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramAstVisibleComponentCounterTests
{
    [Fact]
    public void Count_includes_dashed_likely_edge()
    {
        DiagramAst ast = CreateAst(includeRelationship: true);

        DiagramAstVisibleComponentCounter.Count(ast).Should().Be(1);
    }

    [Fact]
    public void Count_keeps_unconnected_nodes_as_singletons()
    {
        DiagramAst ast = CreateAst(includeRelationship: false);

        DiagramAstVisibleComponentCounter.Count(ast).Should().Be(2);
    }

    [Fact]
    public void Count_ignores_layout_only_edges()
    {
        DiagramAst ast = CreateAst(includeRelationship: false);
        ast.Edges.Add(new DiagramEdge
        {
            FromNodeId = "source",
            ToNodeId = "target",
            Label = "~~~",
            IsLayoutOnly = true,
        });

        DiagramAstVisibleComponentCounter.Count(ast).Should().Be(2);
    }

    private static DiagramAst CreateAst(bool includeRelationship)
    {
        DiagramAst ast = new()
        {
            Nodes =
            [
                new DiagramNode { NodeId = "source", Label = "source" },
                new DiagramNode { NodeId = "target", Label = "target" },
            ],
        };

        if (includeRelationship)
        {
            ast.Edges.Add(new DiagramEdge
            {
                FromNodeId = "source",
                ToNodeId = "target",
                Label = "Likely",
                ProvenanceKind = "DeterministicInference",
            });
        }

        return ast;
    }
}
