using System.Globalization;
using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.Diagrams;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramResourceGroupPackerTests
{
    private readonly DiagramForestLayoutSvgRenderer renderer = new();

    [Fact]
    public void PartitionCells_keeps_named_singleton_resource_groups()
    {
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> cells =
            DiagramResourceGroupPacker.PartitionCells(
            [
                Node("vm-1", "rg-app", orderKey: 0),
                Node("db-1", "rg-data", orderKey: 1),
            ]);

        cells.Should().HaveCount(2);
        cells.Should().OnlyContain(cell => DiagramResourceGroupPacker.ShouldDrawFrame(cell));
        cells.Select(cell => cell.GroupName).Should().BeEquivalentTo(["rg-app", "rg-data"]);
        cells.Should().OnlyContain(cell => cell.Nodes.Count == 1);
    }

    [Fact]
    public void PartitionCells_merges_disconnected_nodes_in_the_same_resource_group()
    {
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> cells =
            DiagramResourceGroupPacker.PartitionCells(
            [
                Node("vm-a1", "rg-app", orderKey: 0),
                Node("vm-a2", "rg-app", orderKey: 1),
                Node("vm-b1", "rg-app", orderKey: 2),
                Node("vm-b2", "rg-app", orderKey: 3),
            ]);

        cells.Should().ContainSingle();
        cells[0].GroupName.Should().Be("rg-app");
        cells[0].Nodes.Select(node => node.NodeId).Should().Equal("vm-a1", "vm-a2", "vm-b1", "vm-b2");
        DiagramResourceGroupPacker.ShouldDrawFrame(cells[0]).Should().BeTrue();
    }

    [Fact]
    public void ShouldDrawFrame_is_false_when_the_resource_group_is_missing()
    {
        DiagramResourceGroupPacker.ResourceGroupCell cell = new(null, [Node("vm-1", resourceGroup: null, orderKey: 0)]);

        DiagramResourceGroupPacker.ShouldDrawFrame(cell).Should().BeFalse();
    }

    [Fact]
    public void ShouldDrawFrame_throws_when_cell_is_null()
    {
        Action act = () => DiagramResourceGroupPacker.ShouldDrawFrame(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("cell");
    }

    [Fact]
    public void PartitionCells_throws_when_nodes_are_null()
    {
        Action act = () => DiagramResourceGroupPacker.PartitionCells(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("nodes");
    }

    [Fact]
    public void ResolveFrameBounds_split_resource_group_in_two_components_emits_one_frame()
    {
        DiagramAst ast = BuildSplitResourceGroupAst();
        DiagramForestLayoutResult result = renderer.Render(ast);

        result.Succeeded.Should().BeTrue();
        XDocument document = XDocument.Parse(result.Svg!);
        List<XElement> frames = document.Descendants()
            .Where(element =>
                string.Equals(element.Name.LocalName, "g", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "rg-frame", StringComparison.Ordinal))
            .ToList();

        frames.Should().HaveCount(1);
        ReadFrameTitle(frames[0]).Should().Be("rg-app");
        CountRgCaptionTexts(document.Root!, "rg-app").Should().Be(0);

        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupFrameBounds> bounds = ReadFrameBounds(document);
        bounds.Should().HaveCount(1);
        DiagramResourceGroupFrameOverlap.AnyOverlap(bounds).Should().BeFalse();
    }

    [Fact]
    public void ResolveFrameBounds_throws_when_node_bounds_are_null()
    {
        Action act = () => DiagramResourceGroupPacker.ResolveFrameBounds(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("nodeBounds");
    }

    [Fact]
    public void ResolveFrameBounds_adjacent_resource_groups_in_one_component_do_not_overlap()
    {
        DiagramAst ast = BuildAdjacentResourceGroupsAst();
        DiagramForestLayoutResult result = renderer.Render(ast);

        result.Succeeded.Should().BeTrue();
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupFrameBounds> bounds =
            ReadFrameBounds(XDocument.Parse(result.Svg!));

        bounds.Should().HaveCount(2);
        DiagramResourceGroupFrameOverlap.AnyOverlap(bounds).Should().BeFalse();

        DiagramResourceGroupPacker.ResourceGroupFrameBounds left = bounds.OrderBy(frame => frame.X).First();
        DiagramResourceGroupPacker.ResourceGroupFrameBounds right = bounds.OrderBy(frame => frame.X).Last();
        double gap = right.X - (left.X + left.Width);

        gap.Should().BeGreaterThanOrEqualTo(48.0d - 1.0d);
    }

    [Fact]
    public void ResolveFrameBounds_triple_fixture_emits_a_frame_for_each_resource_group()
    {
        DiagramAst ast = BuildTripleFixtureAst();
        DiagramForestLayoutResult result = renderer.Render(ast);
        XDocument document = XDocument.Parse(result.Svg!);

        document.Descendants()
            .Count(element =>
                string.Equals(element.Name.LocalName, "g", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "rg-frame", StringComparison.Ordinal))
            .Should()
            .Be(2);

        CountRgCaptionTexts(document.Root!, "rg-app-prod").Should().Be(0);
        CountRgCaptionTexts(document.Root!, "rg-data-prod").Should().Be(0);
        document.Descendants()
            .Where(element =>
                string.Equals(element.Name.LocalName, "text", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "rg-frame-label", StringComparison.Ordinal))
            .Select(element => element.Value)
            .Should()
            .BeEquivalentTo(["rg-app-prod", "rg-data-prod"]);
    }

    [Fact]
    public void Render_frames_use_solid_two_pixel_stroke_and_opaque_fill()
    {
        DiagramAst ast = BuildTripleFixtureAst();
        DiagramForestLayoutResult result = renderer.Render(ast);
        XElement? plate = XDocument.Parse(result.Svg!).Descendants()
            .FirstOrDefault(element =>
                string.Equals(element.Name.LocalName, "rect", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "rg-frame-plate", StringComparison.Ordinal));

        plate.Should().NotBeNull();
        plate!.Attribute("stroke-width")?.Value.Should().Be("2");
        plate.Attribute("stroke")?.Value.Should().Be(DiagramForestResourceGroupFrameStyle.Stroke);
        plate.Attribute("fill")?.Value.Should().Be(DiagramForestResourceGroupFrameStyle.Fill);
        plate.Attribute("stroke-dasharray").Should().BeNull();
        plate.Attribute("fill-opacity")?.Value.Should().BeOneOf("1", null);
        result.Svg.Should().NotContain("stroke-dasharray=\"5 4\"");
    }

    [Fact]
    public void Render_places_resource_group_label_inside_frame()
    {
        DiagramAst ast = BuildTripleFixtureAst();
        DiagramForestLayoutResult result = renderer.Render(ast);
        XDocument document = XDocument.Parse(result.Svg!);
        XElement? plate = document.Descendants()
            .FirstOrDefault(element =>
                string.Equals(element.Name.LocalName, "rect", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "rg-frame-plate", StringComparison.Ordinal));
        XElement? label = document.Descendants()
            .FirstOrDefault(element =>
                string.Equals(element.Name.LocalName, "text", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "rg-frame-label", StringComparison.Ordinal));

        plate.Should().NotBeNull();
        label.Should().NotBeNull();

        double plateY = double.Parse(plate!.Attribute("y")!.Value, CultureInfo.InvariantCulture);
        double labelY = double.Parse(label!.Attribute("y")!.Value, CultureInfo.InvariantCulture);
        labelY.Should().BeGreaterThan(plateY);
        document.Descendants()
            .Any(element =>
                string.Equals(element.Name.LocalName, "rect", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "rg-frame-label-halo", StringComparison.Ordinal))
            .Should()
            .BeTrue();
    }

    private static DiagramAst BuildSplitResourceGroupAst()
    {
        return new DiagramAst
        {
            Title = "split-rg",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vm-a1",
                    Label = "vm-a1",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-app",
                    OrderKey = 0,
                },
                new DiagramNode
                {
                    NodeId = "vm-a2",
                    Label = "vm-a2",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-app",
                    OrderKey = 1,
                },
                new DiagramNode
                {
                    NodeId = "vm-b1",
                    Label = "vm-b1",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-app",
                    OrderKey = 2,
                },
                new DiagramNode
                {
                    NodeId = "vm-b2",
                    Label = "vm-b2",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-app",
                    OrderKey = 3,
                },
            ],
            Edges =
            [
                new DiagramEdge { FromNodeId = "vm-a1", ToNodeId = "vm-a2", Label = "connects" },
                new DiagramEdge { FromNodeId = "vm-b1", ToNodeId = "vm-b2", Label = "connects" },
            ],
        };
    }

    private static DiagramAst BuildAdjacentResourceGroupsAst()
    {
        return new DiagramAst
        {
            Title = "adjacent-rg",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vm-a1",
                    Label = "vm-a1",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-a",
                    OrderKey = 0,
                },
                new DiagramNode
                {
                    NodeId = "vm-a2",
                    Label = "vm-a2",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-a",
                    OrderKey = 1,
                },
                new DiagramNode
                {
                    NodeId = "vm-b1",
                    Label = "vm-b1",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-b",
                    OrderKey = 2,
                },
                new DiagramNode
                {
                    NodeId = "vm-b2",
                    Label = "vm-b2",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-b",
                    OrderKey = 3,
                },
            ],
            Edges =
            [
                new DiagramEdge { FromNodeId = "vm-a1", ToNodeId = "vm-a2", Label = "connects" },
                new DiagramEdge { FromNodeId = "vm-b1", ToNodeId = "vm-b2", Label = "connects" },
                new DiagramEdge { FromNodeId = "vm-a2", ToNodeId = "vm-b1", Label = "connects" },
            ],
        };
    }

    private static DiagramAst BuildTripleFixtureAst()
    {
        return new DiagramAst
        {
            Title = "rg-frame",
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vm-1",
                    Label = "vm-app-a",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-app-prod",
                    OrderKey = 0,
                },
                new DiagramNode
                {
                    NodeId = "vm-2",
                    Label = "vm-app-b",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Compute/virtualMachines",
                    ArmResourceGroup = "rg-app-prod",
                    OrderKey = 1,
                },
                new DiagramNode
                {
                    NodeId = "db-1",
                    Label = "sqldb-app",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Sql/servers/databases",
                    ArmResourceGroup = "rg-data-prod",
                    OrderKey = 2,
                },
            ],
            Edges =
            [
                new DiagramEdge { FromNodeId = "vm-1", ToNodeId = "vm-2", Label = "connects" },
            ],
        };
    }

    private static DiagramNode Node(string nodeId, string? resourceGroup, int orderKey)
    {
        return new DiagramNode
        {
            NodeId = nodeId,
            Label = nodeId,
            NodeType = "TopologyResource",
            ArmResourceType = "Microsoft.Compute/virtualMachines",
            ArmResourceGroup = resourceGroup,
            OrderKey = orderKey,
        };
    }

    private static IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupFrameBounds> ReadFrameBounds(XDocument document)
    {
        List<DiagramResourceGroupPacker.ResourceGroupFrameBounds> frames = [];

        foreach (XElement frame in document.Descendants()
                     .Where(element =>
                         string.Equals(element.Name.LocalName, "g", StringComparison.Ordinal)
                         && string.Equals((string?)element.Attribute("class"), "rg-frame", StringComparison.Ordinal)))
        {
            XElement? plate = frame.Elements()
                .FirstOrDefault(element =>
                    string.Equals(element.Name.LocalName, "rect", StringComparison.Ordinal)
                    && string.Equals((string?)element.Attribute("class"), "rg-frame-plate", StringComparison.Ordinal));

            if (plate is null)
            {
                continue;
            }

            frames.Add(new DiagramResourceGroupPacker.ResourceGroupFrameBounds(
                ReadFrameTitle(frame) ?? string.Empty,
                frame.Attribute("data-frame-cell-id")?.Value ?? string.Empty,
                double.Parse(plate.Attribute("x")!.Value, CultureInfo.InvariantCulture),
                double.Parse(plate.Attribute("y")!.Value, CultureInfo.InvariantCulture),
                double.Parse(plate.Attribute("width")!.Value, CultureInfo.InvariantCulture),
                double.Parse(plate.Attribute("height")!.Value, CultureInfo.InvariantCulture)));
        }

        return frames;
    }

    private static string? ReadFrameTitle(XElement frame)
    {
        return frame.Elements()
            .FirstOrDefault(element => string.Equals(element.Name.LocalName, "title", StringComparison.Ordinal))
            ?.Value;
    }

    private static int CountRgCaptionTexts(XElement root, string groupName)
    {
        return root.Descendants()
            .Count(element =>
                string.Equals(element.Name.LocalName, "text", StringComparison.Ordinal)
                && string.Equals(element.Attribute("font-weight")?.Value, "400", StringComparison.Ordinal)
                && string.Equals(element.Value, groupName, StringComparison.Ordinal));
    }
}
