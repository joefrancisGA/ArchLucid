using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>Shared Data Flow cross-stage edge checks for hub pipeline tests.</summary>
public static class InventoryDiagramExcellenceDataFlowHubRoutingAssertions
{
    public static void AssertCrossStageRouteAvoidsSpokeCards(
        DiagramAst ast,
        XDocument svg,
        string fromNodeId,
        string toNodeId,
        IReadOnlyList<string> spokeNodeIds,
        string edgeLabel = "writes")
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(svg);

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
        DiagramForestDataFlowColumnLayout.NodePlacement from = layout.Placements.Single(placement =>
            string.Equals(placement.Node.NodeId, fromNodeId, StringComparison.Ordinal));
        DiagramForestDataFlowColumnLayout.NodePlacement to = layout.Placements.Single(placement =>
            string.Equals(placement.Node.NodeId, toNodeId, StringComparison.Ordinal));
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
            from,
            to,
            layout.Columns,
            bounds,
            from.Node.NodeId,
            to.Node.NodeId,
            options);

        route.Should().NotBeNull();

        XNamespace svgNamespace = svg.Root!.Name.Namespace;
        XElement? edgePath = svg.Descendants()
            .FirstOrDefault(element =>
                string.Equals(element.Name.LocalName, "g", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "edge", StringComparison.Ordinal)
                && string.Equals(element.Element(svgNamespace + "title")?.Value, edgeLabel, StringComparison.Ordinal))
            ?.Elements()
            .FirstOrDefault(element =>
                string.Equals(element.Name.LocalName, "path", StringComparison.Ordinal)
                && string.Equals((string?)element.Attribute("class"), "edge-path", StringComparison.Ordinal));

        edgePath.Should().NotBeNull();

        foreach (string spokeId in spokeNodeIds)
        {
            DiagramForestDataFlowColumnLayout.NodePlacement spoke = layout.Placements.Single(placement =>
                string.Equals(placement.Node.NodeId, spokeId, StringComparison.Ordinal));
            PathInteriorMustNotIntersectRect(route!, spoke, inflateBy: 1.0d).Should().BeTrue(spokeId);
        }
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
}
