using System.Globalization;
using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

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

        int edgeCount = root.Descendants()
            .Where(element =>
                string.Equals(element.Name.LocalName, "g", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "edge", StringComparison.Ordinal))
            .SelectMany(group => group.Elements())
            .Count(element => string.Equals(element.Name.LocalName, "line", StringComparison.Ordinal));
        edgeCount.Should().Be(6);

        string[] viewBoxParts = (root.Attribute("viewBox")?.Value ?? string.Empty)
            .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
        viewBoxParts.Should().HaveCount(4);

        double viewBoxWidth = double.Parse(viewBoxParts[2], CultureInfo.InvariantCulture);
        double viewBoxHeight = double.Parse(viewBoxParts[3], CultureInfo.InvariantCulture);

        viewBoxWidth.Should().BeLessThan(900);
        viewBoxHeight.Should().BeLessThan(800);
    }

    [Fact]
    public void Render_five_node_chain_uses_left_to_right_ranks()
    {
        GraphSnapshot graph = BuildChainGraph(nodeCount: 5);
        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramForestLayoutResult result = renderer.Render(ast);
        XDocument document = XDocument.Parse(result.Svg!);
        XElement root = document.Root!;

        List<(double X, double Y)> nodes = root.Descendants()
            .Where(element =>
                string.Equals(element.Name.LocalName, "g", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "node", StringComparison.Ordinal))
            .Select(element => (
                X: ParseTranslateX(element.Attribute("transform")?.Value),
                Y: ParseTranslateY(element.Attribute("transform")?.Value)))
            .OrderBy(node => node.X)
            .ToList();

        nodes.Should().HaveCount(5);
        nodes[0].X.Should().BeLessThan(nodes[1].X);
        nodes[1].X.Should().BeLessThan(nodes[2].X);
        nodes[2].X.Should().BeLessThan(nodes[3].X);
        nodes[3].X.Should().BeLessThan(nodes[4].X);
        nodes.Select(node => node.Y).Distinct().Count().Should().Be(1);
    }

    [Fact]
    public void Render_owner_shape_separates_component_columns()
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
    public void Render_uses_pictograms_and_bold_wrapped_names()
    {
        DiagramAst ast = new()
        {
            Title = "labels",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vm-1",
                    Label = "vm-userprovision-hi-nonprod01",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    OrderKey = 0,
                },
                new DiagramNode
                {
                    NodeId = "db-1",
                    Label = "sqldb-app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Sql/servers/databases",
                    OrderKey = 1,
                },
            ],
        };

        DiagramForestLayoutResult result = renderer.Render(ast);
        result.Succeeded.Should().BeTrue();
        result.Svg.Should().Contain("font-weight=\"700\"");
        result.Svg.Should().Contain("class=\"pictogram\"");
        result.Svg.Should().Contain("data-kind=\"Compute\"");
        result.Svg.Should().Contain("data-kind=\"Data\"");
        result.Svg.Should().Contain("<title>vm-userprovision-hi-nonprod01 (Virtual machine)</title>");
        result.Svg.Should().Contain("<title>sqldb-app (SQL database)</title>");
        result.Svg.Should().Contain("<tspan");
        result.Svg.Should().NotContain("fill=\"#f8fafc\"");
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

    private static double ParseTranslateY(string? transform)
    {
        if (string.IsNullOrWhiteSpace(transform) || !transform.StartsWith("translate(", StringComparison.Ordinal))
        {
            return double.NaN;
        }

        string inner = transform["translate(".Length..].TrimEnd(')');
        string[] parts = inner.Split(',');

        if (parts.Length < 2)
        {
            return double.NaN;
        }

        return double.Parse(parts[1], CultureInfo.InvariantCulture);
    }

    private static GraphSnapshot BuildChainGraph(int nodeCount)
    {
        List<GraphNode> nodes = [];
        List<GraphEdge> edges = [];

        for (int index = 0; index < nodeCount; index++)
        {
            string nodeId = $"vm-{index}";
            string armId =
                $"/subscriptions/sub/resourceGroups/rg-app/providers/Microsoft.Compute/virtualMachines/vm-{index}";
            GraphNode node = new()
            {
                NodeId = nodeId,
                NodeType = GraphNodeTypes.TopologyResource,
                Label = $"vm-{index}",
                SourceType = "azure-inventory-snapshot",
                SourceId = armId,
            };
            node.Properties["arm.id"] = armId;
            node.Properties["arm.type"] = "Microsoft.Compute/virtualMachines";
            node.Properties["arm.resourceGroup"] = "rg-app";
            node.Properties["arm.subscriptionId"] = "sub";
            nodes.Add(node);

            if (index > 0)
            {
                edges.Add(new GraphEdge
                {
                    EdgeId = $"edge-{index}",
                    FromNodeId = $"vm-{index - 1}",
                    ToNodeId = nodeId,
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 1.0d,
                });
            }
        }

        return new GraphSnapshot
        {
            Nodes = nodes,
            Edges = edges,
        };
    }
}
