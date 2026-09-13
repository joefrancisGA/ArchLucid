using System.Globalization;
using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramForestLayoutSvgRendererTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();
    private readonly DiagramForestLayoutSvgRenderer renderer = new();

    [Fact]
    public void Render_owner_shape_executive_vnets_places_eleven_nodes_with_tight_viewbox()
    {
        GraphSnapshot graph = DiagramSparseComponentPackerTests.BuildExecutiveOwnerShapePeeringGraph();
        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);

        DiagramForestLayoutResult result = renderer.Render(ast);

        result.Succeeded.Should().BeTrue();
        result.Svg.Should().NotBeNullOrWhiteSpace();
        result.Svg.Should().Contain("g class=\"node\"");

        XDocument document = XDocument.Parse(result.Svg!);
        XElement? root = document.Root;
        root.Should().NotBeNull();
        root!.Name.LocalName.Should().Be("svg");

        int nodeCount = root.Descendants().Count(element =>
            string.Equals(element.Name.LocalName, "g", StringComparison.Ordinal)
            && string.Equals((string?)element.Attribute("class"), "node", StringComparison.Ordinal));
        nodeCount.Should().Be(11);

        int edgeCount = root.Descendants().Count(element =>
            string.Equals(element.Name.LocalName, "line", StringComparison.Ordinal));
        edgeCount.Should().Be(6);

        string[] viewBoxParts = (root.Attribute("viewBox")?.Value ?? string.Empty)
            .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
        viewBoxParts.Should().HaveCount(4);

        double viewBoxWidth = double.Parse(viewBoxParts[2], CultureInfo.InvariantCulture);
        double viewBoxHeight = double.Parse(viewBoxParts[3], CultureInfo.InvariantCulture);

        viewBoxWidth.Should().BeLessThan(900);
        viewBoxHeight.Should().BeLessThan(500);
        (viewBoxWidth / viewBoxHeight).Should().BeGreaterThan(1.0);
    }

    [Fact]
    public void Render_owner_shape_uses_three_column_component_grid()
    {
        GraphSnapshot graph = DiagramSparseComponentPackerTests.BuildExecutiveOwnerShapePeeringGraph();
        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);

        DiagramForestLayoutResult result = renderer.Render(ast);
        XDocument document = XDocument.Parse(result.Svg!);
        XElement root = document.Root!;

        List<double> nodeXs = root.Descendants()
            .Where(element =>
                string.Equals(element.Name.LocalName, "g", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "node", StringComparison.Ordinal))
            .Select(element => ParseTranslateX(element.Attribute("transform")?.Value))
            .OrderBy(x => x)
            .ToList();

        nodeXs.Should().HaveCount(11);
        nodeXs.Distinct().Count().Should().BeGreaterThanOrEqualTo(3);
    }

    [Fact]
    public void Render_empty_ast_fails_soft()
    {
        DiagramForestLayoutResult result = renderer.Render(new DiagramAst { Title = "empty" });

        result.Succeeded.Should().BeFalse();
        result.Error.Should().NotBeNullOrWhiteSpace();
    }

    private static double ParseTranslateX(string? transform)
    {
        if (string.IsNullOrWhiteSpace(transform) || !transform.StartsWith("translate(", StringComparison.Ordinal))
        {
            return double.NaN;
        }

        string inner = transform["translate(".Length..].TrimEnd(')');
        string[] parts = inner.Split(',');

        return double.Parse(parts[0], CultureInfo.InvariantCulture);
    }
}
