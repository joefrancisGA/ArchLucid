using System.Globalization;
using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramForestDataFlowEdgeRouterTests
{
    private readonly DiagramForestLayoutSvgRenderer renderer = new();

    [Fact]
    public void TryRoute_adjacent_columns_travels_in_gutter_without_hitting_third_card()
    {
        DiagramForestLayoutOptions options = new();
        DiagramForestDataFlowColumnLayout.Result layout = BuildThreeColumnLayout(options);
        DiagramForestDataFlowColumnLayout.NodePlacement source = layout.Placements.Single(placement =>
            string.Equals(placement.Node.NodeId, "source-node", StringComparison.Ordinal));
        DiagramForestDataFlowColumnLayout.NodePlacement application = layout.Placements.Single(placement =>
            string.Equals(placement.Node.NodeId, "app-node", StringComparison.Ordinal));
        DiagramForestDataFlowColumnLayout.NodePlacement storage = layout.Placements.Single(placement =>
            string.Equals(placement.Node.NodeId, "storage-node", StringComparison.Ordinal));
        List<DiagramResourceGroupPacker.NodePlacementBounds> bounds = layout.Placements
            .Select(placement => new DiagramResourceGroupPacker.NodePlacementBounds(
                placement.Node,
                placement.X,
                placement.Y,
                placement.Width,
                placement.Height,
                FrameCellId: null))
            .ToList();

        DiagramForestOrthogonalEdgeRouter.RouteResult? route = DiagramForestDataFlowEdgeRouter.TryRoute(
            source,
            storage,
            layout.Columns,
            bounds,
            source.Node.NodeId,
            storage.Node.NodeId,
            options);

        route.Should().NotBeNull();
        PathInteriorMustNotIntersectRect(route!, application, inflateBy: 1.0d).Should().BeTrue();
    }

    [Fact]
    public void TryRoute_adjacent_source_to_application_does_not_enter_storage_card()
    {
        DiagramForestLayoutOptions options = new();
        DiagramForestDataFlowColumnLayout.Result layout = BuildThreeColumnLayout(options);
        DiagramForestDataFlowColumnLayout.NodePlacement source = layout.Placements.Single(placement =>
            string.Equals(placement.Node.NodeId, "source-node", StringComparison.Ordinal));
        DiagramForestDataFlowColumnLayout.NodePlacement application = layout.Placements.Single(placement =>
            string.Equals(placement.Node.NodeId, "app-node", StringComparison.Ordinal));
        DiagramForestDataFlowColumnLayout.NodePlacement storage = layout.Placements.Single(placement =>
            string.Equals(placement.Node.NodeId, "storage-node", StringComparison.Ordinal));
        List<DiagramResourceGroupPacker.NodePlacementBounds> bounds = layout.Placements
            .Select(placement => new DiagramResourceGroupPacker.NodePlacementBounds(
                placement.Node,
                placement.X,
                placement.Y,
                placement.Width,
                placement.Height,
                FrameCellId: null))
            .ToList();

        DiagramForestOrthogonalEdgeRouter.RouteResult? route = DiagramForestDataFlowEdgeRouter.TryRoute(
            source,
            application,
            layout.Columns,
            bounds,
            source.Node.NodeId,
            application.Node.NodeId,
            options);

        route.Should().NotBeNull();
        PathInteriorMustNotIntersectRect(route!, storage, inflateBy: 1.0d).Should().BeTrue();
    }

    [Fact]
    public void TryRoute_preserves_direction_for_a_right_to_left_data_flow_edge()
    {
        DiagramForestLayoutOptions options = new();
        DiagramForestDataFlowColumnLayout.Result layout = BuildThreeColumnLayout(options);
        DiagramForestDataFlowColumnLayout.NodePlacement source = layout.Placements.Single(placement =>
            string.Equals(placement.Node.NodeId, "source-node", StringComparison.Ordinal));
        DiagramForestDataFlowColumnLayout.NodePlacement storage = layout.Placements.Single(placement =>
            string.Equals(placement.Node.NodeId, "storage-node", StringComparison.Ordinal));
        List<DiagramResourceGroupPacker.NodePlacementBounds> bounds = layout.Placements
            .Select(placement => new DiagramResourceGroupPacker.NodePlacementBounds(
                placement.Node,
                placement.X,
                placement.Y,
                placement.Width,
                placement.Height,
                FrameCellId: null))
            .ToList();

        DiagramForestOrthogonalEdgeRouter.RouteResult? route = DiagramForestDataFlowEdgeRouter.TryRoute(
            storage,
            source,
            layout.Columns,
            bounds,
            storage.Node.NodeId,
            source.Node.NodeId,
            options);

        route.Should().NotBeNull();
        route!.Segments[0].X1.Should().BeApproximately(storage.X, 0.001d);
        route.Segments[^1].X2.Should().BeApproximately(source.X + source.Width, 0.001d);
    }

    [Fact]
    public void Render_data_flow_source_to_storage_edge_avoids_application_card()
    {
        DiagramAst ast = BuildDataFlowRoutingAst();
        DiagramForestLayoutResult result = renderer.Render(ast);

        result.Succeeded.Should().BeTrue();
        XDocument document = XDocument.Parse(result.Svg!);
        XElement root = document.Root!;
        DiagramForestDataFlowColumnLayout.NodePlacement application = BuildThreeColumnLayout(new DiagramForestLayoutOptions())
            .Placements.Single(placement => string.Equals(placement.Node.NodeId, "app-node", StringComparison.Ordinal));
        XElement? edgeGroup = root.Descendants()
            .FirstOrDefault(element =>
                string.Equals(element.Name.LocalName, "g", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "edge", StringComparison.Ordinal)
                && string.Equals(element.Element(XNamespace.Get("http://www.w3.org/2000/svg") + "title")?.Value, "flows", StringComparison.Ordinal));
        XElement? edgePath = edgeGroup?.Elements()
            .FirstOrDefault(element =>
                string.Equals(element.Name.LocalName, "path", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "edge-path", StringComparison.Ordinal));

        edgePath.Should().NotBeNull();
        PathDataInteriorMustNotIntersectRect(edgePath!.Attribute("d")?.Value ?? string.Empty, application, 1.0d)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void TryRoute_skipped_columns_uses_source_and_target_gutters_around_other_cards()
    {
        DiagramAst ast = BuildDenseDataFlowRoutingAst();
        DiagramForestLayoutOptions options = new();
        DiagramForestCanvasLabelContext labelContext = DiagramForestCanvasLabelContext.Create(ast.Nodes, options);
        DiagramForestDataFlowColumnLayout.Result layout = DiagramForestDataFlowColumnLayout.Plan(
            ast.Nodes,
            ast.Subgraphs,
            options,
            labelContext);
        DiagramForestDataFlowColumnLayout.NodePlacement source = layout.Placements.Single(placement =>
            string.Equals(placement.Node.NodeId, "source-middle", StringComparison.Ordinal));
        DiagramForestDataFlowColumnLayout.NodePlacement storage = layout.Placements.Single(placement =>
            string.Equals(placement.Node.NodeId, "storage-node", StringComparison.Ordinal));
        List<DiagramResourceGroupPacker.NodePlacementBounds> bounds = layout.Placements
            .Select(placement => new DiagramResourceGroupPacker.NodePlacementBounds(
                placement.Node,
                placement.X,
                placement.Y,
                placement.Width,
                placement.Height,
                FrameCellId: null))
            .ToList();

        DiagramForestOrthogonalEdgeRouter.RouteResult? route = DiagramForestDataFlowEdgeRouter.TryRoute(
            source,
            storage,
            layout.Columns,
            bounds,
            source.Node.NodeId,
            storage.Node.NodeId,
            options);

        route.Should().NotBeNull();
        foreach (DiagramForestDataFlowColumnLayout.NodePlacement other in layout.Placements.Where(placement =>
                     placement.Node.NodeId is not "source-middle" and not "storage-node"))
        {
            PathInteriorMustNotIntersectRect(route!, other, inflateBy: 1.0d).Should().BeTrue();
        }
    }

    [Fact]
    public void Plan_wraps_large_stage_into_subcolumns_before_next_stage()
    {
        DiagramAst ast = BuildDataFlowRoutingAst();
        ast.Nodes.RemoveAll(node => string.Equals(node.NodeId, "storage-node", StringComparison.Ordinal));
        ast.Nodes.AddRange(Enumerable.Range(0, 30).Select(index => new DiagramNode
        {
            NodeId = $"storage-{index}",
            Label = $"storage-{index}",
            NodeType = "TopologyResource",
            ArmResourceType = "Microsoft.Storage/storageAccounts",
            SubgraphId = "data-flow-stage-storage",
            OrderKey = index,
        }));
        ast.Subgraphs.Add(new DiagramSubgraph
        {
            SubgraphId = "data-flow-stage-transform",
            Label = "Transform",
            OrderKey = 3,
        });
        ast.Nodes.Add(new DiagramNode
        {
            NodeId = "transform-node",
            Label = "transform",
            NodeType = "TopologyResource",
            ArmResourceType = "Microsoft.DataFactory/factories",
            SubgraphId = "data-flow-stage-transform",
            OrderKey = 0,
        });

        DiagramForestLayoutOptions options = new();
        DiagramForestCanvasLabelContext labelContext = DiagramForestCanvasLabelContext.Create(ast.Nodes, options);
        DiagramForestDataFlowColumnLayout.Result layout = DiagramForestDataFlowColumnLayout.Plan(
            ast.Nodes,
            ast.Subgraphs,
            options,
            labelContext,
            ast.Edges);

        List<DiagramForestDataFlowColumnLayout.ColumnInfo> storageColumns = layout.Columns
            .Where(column => string.Equals(column.Label, "Storage", StringComparison.Ordinal))
            .ToList();
        storageColumns.Should().HaveCount(3);
        storageColumns.Select(column => layout.Placements.Count(placement =>
                placement.ColumnIndex == column.ColumnIndex))
            .Should()
            .OnlyContain(count => count <= DiagramForestDataFlowColumnLayout.MaxCardsPerDataFlowSubcolumn);

        DiagramForestDataFlowColumnLayout.ColumnInfo transformColumn = layout.Columns.Single(column =>
            string.Equals(column.Label, "Transform", StringComparison.Ordinal));
        transformColumn.LeftX.Should().BeGreaterThan(storageColumns[^1].LeftX + storageColumns[^1].Width);
    }

    [Fact]
    public void Render_data_flow_marks_unconnected_cards_after_connected_cards()
    {
        DiagramAst ast = BuildDataFlowRoutingAst();
        ast.Nodes.AddRange(
        [
            new DiagramNode
            {
                NodeId = "storage-unconnected",
                Label = "storage-unconnected",
                NodeType = "TopologyResource",
                ArmResourceType = "Microsoft.Storage/storageAccounts",
                SubgraphId = "data-flow-stage-storage",
                OrderKey = 0,
            },
            new DiagramNode
            {
                NodeId = "storage-connected",
                Label = "storage-connected",
                NodeType = "TopologyResource",
                ArmResourceType = "Microsoft.Storage/storageAccounts",
                SubgraphId = "data-flow-stage-storage",
                OrderKey = 1,
            },
        ]);
        ast.Edges.Add(new DiagramEdge
        {
            FromNodeId = "source-node",
            ToNodeId = "storage-connected",
            Label = "flows",
        });

        DiagramForestLayoutOptions options = new();
        DiagramForestCanvasLabelContext labelContext = DiagramForestCanvasLabelContext.Create(
            ast.Nodes,
            options,
            ast.Edges,
            isDataFlow: true);
        DiagramForestDataFlowColumnLayout.Result layout = DiagramForestDataFlowColumnLayout.Plan(
            ast.Nodes,
            ast.Subgraphs,
            options,
            labelContext,
            ast.Edges);
        DiagramForestDataFlowColumnLayout.NodePlacement connected = layout.Placements.Single(placement =>
            string.Equals(placement.Node.NodeId, "storage-connected", StringComparison.Ordinal));
        DiagramForestDataFlowColumnLayout.NodePlacement unconnected = layout.Placements.Single(placement =>
            string.Equals(placement.Node.NodeId, "storage-unconnected", StringComparison.Ordinal));

        connected.Y.Should().BeLessThan(unconnected.Y);

        DiagramForestLayoutResult result = renderer.Render(ast);
        result.Succeeded.Should().BeTrue();
        result.Svg.Should().NotBeNull();
        CountOccurrences(result.Svg!, "Not connected").Should().Be(1);
    }

    private static DiagramForestDataFlowColumnLayout.Result BuildThreeColumnLayout(DiagramForestLayoutOptions options)
    {
        DiagramAst ast = BuildDataFlowRoutingAst();
        DiagramForestCanvasLabelContext labelContext = DiagramForestCanvasLabelContext.Create(ast.Nodes, options);

        return DiagramForestDataFlowColumnLayout.Plan(
            ast.Nodes,
            ast.Subgraphs,
            options,
            labelContext);
    }

    private static DiagramAst BuildDataFlowRoutingAst()
    {
        return new DiagramAst
        {
            Title = "Azure inventory (DataFlow)",
            Subgraphs =
            [
                new DiagramSubgraph
                {
                    SubgraphId = "data-flow-stage-source",
                    Label = "Source",
                    OrderKey = 0,
                },
                new DiagramSubgraph
                {
                    SubgraphId = "data-flow-stage-application",
                    Label = "Application",
                    OrderKey = 1,
                },
                new DiagramSubgraph
                {
                    SubgraphId = "data-flow-stage-storage",
                    Label = "Storage",
                    OrderKey = 2,
                },
            ],
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "source-node",
                    Label = "source-blob",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Storage/storageAccounts",
                    SubgraphId = "data-flow-stage-source",
                    OrderKey = 0,
                },
                new DiagramNode
                {
                    NodeId = "app-node",
                    Label = "app-fn",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Web/sites",
                    SubgraphId = "data-flow-stage-application",
                    OrderKey = 1,
                },
                new DiagramNode
                {
                    NodeId = "storage-node",
                    Label = "storage-acct",
                    NodeType = "TopologyResource",
                    ArmResourceType = "Microsoft.Storage/storageAccounts",
                    SubgraphId = "data-flow-stage-storage",
                    OrderKey = 2,
                },
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "source-node",
                    ToNodeId = "storage-node",
                    Label = "flows",
                },
                new DiagramEdge
                {
                    FromNodeId = "source-node",
                    ToNodeId = "app-node",
                    Label = "calls",
                },
            ],
        };
    }

    private static DiagramAst BuildDenseDataFlowRoutingAst()
    {
        DiagramAst ast = BuildDataFlowRoutingAst();
        ast.Nodes.AddRange(
        [
            new DiagramNode
            {
                NodeId = "source-middle",
                Label = "source-middle",
                NodeType = "TopologyResource",
                ArmResourceType = "Microsoft.Storage/storageAccounts",
                SubgraphId = "data-flow-stage-source",
                OrderKey = 1,
            },
            new DiagramNode
            {
                NodeId = "source-bottom",
                Label = "source-with-a-long-name-to-widen-the-column",
                NodeType = "TopologyResource",
                ArmResourceType = "Microsoft.Storage/storageAccounts",
                SubgraphId = "data-flow-stage-source",
                OrderKey = 2,
            },
        ]);
        return ast;
    }

    private static bool PathInteriorMustNotIntersectRect(
        DiagramForestOrthogonalEdgeRouter.RouteResult route,
        DiagramForestDataFlowColumnLayout.NodePlacement placement,
        double inflateBy)
    {
        foreach ((double x1, double y1, double x2, double y2) in route.Segments)
        {
            for (double t = 0.1d; t <= 0.9d; t += 0.1d)
            {
                double px = x1 + (t * (x2 - x1));
                double py = y1 + (t * (y2 - y1));

                if (PointInInflatedRectInterior(px, py, placement, inflateBy))
                {
                    return false;
                }
            }
        }

        return true;
    }

    private static bool PathDataInteriorMustNotIntersectRect(
        string pathData,
        DiagramForestDataFlowColumnLayout.NodePlacement placement,
        double inflateBy)
    {
        List<(double X1, double Y1, double X2, double Y2)> segments = ParseOrthogonalPathData(pathData);

        foreach ((double x1, double y1, double x2, double y2) in segments)
        {
            for (double t = 0.1d; t <= 0.9d; t += 0.1d)
            {
                double px = x1 + (t * (x2 - x1));
                double py = y1 + (t * (y2 - y1));

                if (PointInInflatedRectInterior(px, py, placement, inflateBy))
                {
                    return false;
                }
            }
        }

        return true;
    }

    private static bool PointInInflatedRectInterior(
        double x,
        double y,
        DiagramForestDataFlowColumnLayout.NodePlacement placement,
        double inflateBy)
    {
        double left = placement.X - inflateBy;
        double top = placement.Y - inflateBy;
        double right = placement.X + placement.Width + inflateBy;
        double bottom = placement.Y + placement.Height + inflateBy;

        return x > left && x < right && y > top && y < bottom;
    }

    private static List<(double X1, double Y1, double X2, double Y2)> ParseOrthogonalPathData(string pathData)
    {
        List<(double X1, double Y1, double X2, double Y2)> segments = [];
        string[] tokens = pathData.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        double currentX = 0.0d;
        double currentY = 0.0d;
        int index = 0;

        while (index < tokens.Length)
        {
            if (string.Equals(tokens[index], "M", StringComparison.Ordinal) && index + 2 < tokens.Length)
            {
                currentX = double.Parse(tokens[index + 1], CultureInfo.InvariantCulture);
                currentY = double.Parse(tokens[index + 2], CultureInfo.InvariantCulture);
                index += 3;
                continue;
            }

            if (string.Equals(tokens[index], "L", StringComparison.Ordinal) && index + 2 < tokens.Length)
            {
                double nextX = double.Parse(tokens[index + 1], CultureInfo.InvariantCulture);
                double nextY = double.Parse(tokens[index + 2], CultureInfo.InvariantCulture);
                segments.Add((currentX, currentY, nextX, nextY));
                currentX = nextX;
                currentY = nextY;
                index += 3;
                continue;
            }

            index++;
        }

        return segments;
    }

    private static int CountOccurrences(string value, string search)
    {
        int count = 0;
        int offset = 0;

        while ((offset = value.IndexOf(search, offset, StringComparison.Ordinal)) >= 0)
        {
            count++;
            offset += search.Length;
        }

        return count;
    }
}
