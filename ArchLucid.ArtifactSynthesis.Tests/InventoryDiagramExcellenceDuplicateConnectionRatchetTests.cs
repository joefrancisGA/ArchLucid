using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramExcellenceDuplicateConnectionRatchetTests
{
    private readonly DiagramForestLayoutSvgRenderer renderer = new();

    [Fact]
    public void InventoryDiagramExcellence_duplicate_connections_roll_up_with_single_cited_edge()
    {
        DiagramAst ast = InventoryDiagramExcellenceDuplicateConnectionFixture.BuildDuplicateOffice365Connections();
        DiagramInventoryConnectionRollupApplier.Apply(ast);

        ast.Nodes.Should().ContainSingle(node => node.Label == "Office 365 (2)");
        ast.Edges.Should().ContainSingle(edge => edge.Label == "uses");
        ast.Nodes.Should().NotContain(node => node.NodeId == "connection-a");
        ast.Nodes.Should().NotContain(node => node.NodeId == "connection-b");
    }

    [Fact]
    public void InventoryDiagramExcellence_distinct_connection_apis_do_not_merge()
    {
        DiagramAst ast = InventoryDiagramExcellenceDuplicateConnectionFixture.BuildDistinctApiConnections();
        DiagramInventoryConnectionRollupApplier.Apply(ast);

        ast.Nodes.Should().Contain(node => node.Label == "Office 365");
        ast.Nodes.Should().Contain(node => node.Label == "Microsoft Teams");
        ast.Nodes.Should().NotContain(node => node.Label.Contains('('));
        ast.Edges.Should().HaveCount(2);
    }

    [Fact]
    public void InventoryDiagramExcellence_duplicate_connection_forest_render_shows_merged_label()
    {
        DiagramAst ast = InventoryDiagramExcellenceDuplicateConnectionFixture.BuildDuplicateOffice365Connections();
        DiagramInventoryConnectionRollupApplier.Apply(ast);

        DiagramForestLayoutResult layout = renderer.Render(ast);

        layout.Succeeded.Should().BeTrue(layout.Error);
        layout.Svg.Should().Contain("Office 365 (2)");
        layout.Svg.Should().Contain("workflow");
    }
}
