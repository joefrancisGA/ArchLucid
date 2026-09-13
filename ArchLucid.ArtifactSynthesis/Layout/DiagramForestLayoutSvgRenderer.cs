using System.Globalization;
using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;

namespace ArchLucid.ArtifactSynthesis.Layout;

public sealed class DiagramForestLayoutSvgRenderer : IDiagramForestLayoutSvgRenderer
{
    private sealed record NodePlacement(
        DiagramNode Node,
        double X,
        double Y,
        double Width,
        double Height);

    public DiagramForestLayoutResult Render(DiagramAst ast, DiagramForestLayoutOptions? options = null)
    {
        ArgumentNullException.ThrowIfNull(ast);

        DiagramForestLayoutOptions resolvedOptions = options ?? new DiagramForestLayoutOptions();
        List<DiagramNode> renderableNodes = ast.Nodes
            .Where(node => !IsPackingSubgraphMember(ast, node))
            .OrderBy(node => node.OrderKey)
            .ThenBy(node => node.NodeId, StringComparer.Ordinal)
            .ToList();

        if (renderableNodes.Count == 0)
        {
            return DiagramForestLayoutResult.Failed("Diagram AST contained no renderable nodes.");
        }

        IReadOnlyList<DiagramEdge> visibleEdges = DiagramEdgeVisibility.VisibleEdges(ast.Edges).ToList();
        List<List<DiagramNode>> components = DiagramComponentBuilder.BuildConnectedComponents(renderableNodes, ast.Edges);
        List<IReadOnlyList<DiagramNode>> orderedComponents = DiagramComponentRowPlanner.OrderComponents(components);
        int columnCount = DiagramComponentRowPlanner.ResolveColumnCount(orderedComponents.Count);
        List<List<IReadOnlyList<DiagramNode>>> rows = DiagramComponentRowPlanner.ChunkRows(orderedComponents, columnCount);

        List<ComponentLayout> componentLayouts = BuildComponentLayouts(rows, visibleEdges, resolvedOptions);

        if (componentLayouts.Count == 0)
        {
            return DiagramForestLayoutResult.Failed("Forest layout produced no component placements.");
        }

        List<NodePlacement> placements = PlaceNodes(componentLayouts, resolvedOptions);
        string svg = EmitSvg(placements, visibleEdges, resolvedOptions);

        if (string.IsNullOrWhiteSpace(svg))
        {
            return DiagramForestLayoutResult.Failed("Forest layout produced empty SVG.");
        }

        return new DiagramForestLayoutResult
        {
            Succeeded = true,
            Svg = svg,
        };
    }

    private static bool IsPackingSubgraphMember(DiagramAst ast, DiagramNode node)
    {
        if (string.IsNullOrWhiteSpace(node.SubgraphId))
        {
            return false;
        }

        DiagramSubgraph? subgraph = ast.Subgraphs.FirstOrDefault(candidate =>
            string.Equals(candidate.SubgraphId, node.SubgraphId, StringComparison.Ordinal));

        return subgraph is not null && DiagramSparseComponentPacker.IsPackingSubgraph(subgraph);
    }

    private static List<ComponentLayout> BuildComponentLayouts(
        IReadOnlyList<List<IReadOnlyList<DiagramNode>>> rows,
        IReadOnlyList<DiagramEdge> visibleEdges,
        DiagramForestLayoutOptions options)
    {
        List<ComponentLayout> layouts = [];

        for (int rowIndex = 0; rowIndex < rows.Count; rowIndex++)
        {
            List<IReadOnlyList<DiagramNode>> row = rows[rowIndex];

            for (int columnIndex = 0; columnIndex < row.Count; columnIndex++)
            {
                IReadOnlyList<DiagramNode> component = row[columnIndex];
                List<NodePlacement> relativePlacements = LayoutComponentInterior(component, visibleEdges, options);
                double width = relativePlacements.Count == 0
                    ? options.MinNodeWidth
                    : relativePlacements.Max(placement => placement.X + placement.Width);
                double height = relativePlacements.Count == 0
                    ? options.NodeHeight
                    : relativePlacements.Max(placement => placement.Y + placement.Height);

                layouts.Add(new ComponentLayout(
                    RowIndex: rowIndex,
                    ColumnIndex: columnIndex,
                    RelativePlacements: relativePlacements,
                    Width: width,
                    Height: height));
            }
        }

        return layouts;
    }

    private static List<NodePlacement> LayoutComponentInterior(
        IReadOnlyList<DiagramNode> component,
        IReadOnlyList<DiagramEdge> visibleEdges,
        DiagramForestLayoutOptions options)
    {
        if (DiagramLeftToRightLayerPlanner.ShouldLayoutLeftToRight(component))
        {
            return LayoutLeftToRight(component, visibleEdges, options);
        }

        return LayoutTopDown(component, visibleEdges, options);
    }

    private static List<NodePlacement> LayoutTopDown(
        IReadOnlyList<DiagramNode> component,
        IReadOnlyList<DiagramEdge> visibleEdges,
        DiagramForestLayoutOptions options)
    {
        List<DiagramNode> orderedNodes = OrderNodesAlongFlow(component, visibleEdges);
        List<NodePlacement> placements = [];
        double nodeY = 0;

        foreach (DiagramNode node in orderedNodes)
        {
            DiagramForestNodeMetrics metrics = DiagramForestNodeMetricsCalculator.Measure(node, options);
            placements.Add(new NodePlacement(node, 0, nodeY, metrics.Width, metrics.Height));
            nodeY += metrics.Height + options.NodeVerticalGap;
        }

        double maxWidth = placements.Count == 0 ? options.MinNodeWidth : placements.Max(placement => placement.Width);

        return placements
            .Select(placement => placement with { X = (maxWidth - placement.Width) / 2.0 })
            .ToList();
    }

    private static List<NodePlacement> LayoutLeftToRight(
        IReadOnlyList<DiagramNode> component,
        IReadOnlyList<DiagramEdge> visibleEdges,
        DiagramForestLayoutOptions options)
    {
        IReadOnlyList<IReadOnlyList<DiagramNode>> layers =
            DiagramLeftToRightLayerPlanner.AssignLayers(component, visibleEdges);
        List<NodePlacement> placements = [];
        double columnX = 0;

        foreach (IReadOnlyList<DiagramNode> layer in layers)
        {
            List<(DiagramNode Node, DiagramForestNodeMetrics Metrics)> sized = layer
                .Select(node => (Node: node, Metrics: DiagramForestNodeMetricsCalculator.Measure(node, options)))
                .ToList();
            double columnWidth = sized.Count == 0 ? options.MinNodeWidth : sized.Max(item => item.Metrics.Width);
            double nodeY = 0;

            foreach ((DiagramNode node, DiagramForestNodeMetrics metrics) in sized)
            {
                double nodeX = columnX + ((columnWidth - metrics.Width) / 2.0);
                placements.Add(new NodePlacement(node, nodeX, nodeY, metrics.Width, metrics.Height));
                nodeY += metrics.Height + options.NodeVerticalGap;
            }

            columnX += columnWidth + options.NodeHorizontalGap;
        }

        return placements;
    }

    private static List<NodePlacement> PlaceNodes(
        IReadOnlyList<ComponentLayout> componentLayouts,
        DiagramForestLayoutOptions options)
    {
        int rowCount = componentLayouts.Max(layout => layout.RowIndex) + 1;
        int columnCount = componentLayouts.Max(layout => layout.ColumnIndex) + 1;
        double[] columnWidths = new double[columnCount];
        double[] rowHeights = new double[rowCount];

        foreach (ComponentLayout layout in componentLayouts)
        {
            columnWidths[layout.ColumnIndex] = Math.Max(columnWidths[layout.ColumnIndex], layout.Width);
            rowHeights[layout.RowIndex] = Math.Max(rowHeights[layout.RowIndex], layout.Height);
        }

        List<NodePlacement> placements = [];

        foreach (ComponentLayout layout in componentLayouts)
        {
            double cellX = options.Padding;

            for (int column = 0; column < layout.ColumnIndex; column++)
            {
                cellX += columnWidths[column] + options.ComponentHorizontalGap;
            }

            double cellY = options.Padding;

            for (int row = 0; row < layout.RowIndex; row++)
            {
                cellY += rowHeights[row] + options.ComponentVerticalGap;
            }

            foreach (NodePlacement relative in layout.RelativePlacements)
            {
                placements.Add(relative with
                {
                    X = cellX + relative.X,
                    Y = cellY + relative.Y,
                });
            }
        }

        return placements;
    }

    private static string EmitSvg(
        IReadOnlyList<NodePlacement> placements,
        IReadOnlyList<DiagramEdge> visibleEdges,
        DiagramForestLayoutOptions options)
    {
        if (placements.Count == 0)
        {
            return string.Empty;
        }

        double minX = placements.Min(placement => placement.X) - options.Padding;
        double minY = placements.Min(placement => placement.Y) - options.Padding;
        double maxX = placements.Max(placement => placement.X + placement.Width) + options.Padding;
        double maxY = placements.Max(placement => placement.Y + placement.Height) + options.Padding;
        double viewBoxWidth = Math.Max(1, maxX - minX);
        double viewBoxHeight = Math.Max(1, maxY - minY);

        Dictionary<string, NodePlacement> placementById = placements.ToDictionary(
            placement => placement.Node.NodeId,
            StringComparer.Ordinal);

        XNamespace svgNamespace = "http://www.w3.org/2000/svg";
        XElement root = new(
            svgNamespace + "svg",
            new XAttribute("xmlns", svgNamespace.NamespaceName),
            new XAttribute(
                "viewBox",
                string.Create(
                    CultureInfo.InvariantCulture,
                    $"{minX:0.###} {minY:0.###} {viewBoxWidth:0.###} {viewBoxHeight:0.###}")));

        XElement edgeLayer = new(svgNamespace + "g", new XAttribute("class", "edge"));

        foreach (DiagramEdge edge in visibleEdges)
        {
            if (!placementById.TryGetValue(edge.FromNodeId, out NodePlacement? fromPlacement)
                || !placementById.TryGetValue(edge.ToNodeId, out NodePlacement? toPlacement))
            {
                continue;
            }

            (double fromX, double fromY, double toX, double toY) = ResolveEdgeEndpoints(fromPlacement, toPlacement);

            edgeLayer.Add(new XElement(
                svgNamespace + "line",
                new XAttribute("x1", FormatCoordinate(fromX)),
                new XAttribute("y1", FormatCoordinate(fromY)),
                new XAttribute("x2", FormatCoordinate(toX)),
                new XAttribute("y2", FormatCoordinate(toY)),
                new XAttribute("stroke", "#64748b"),
                new XAttribute("stroke-width", "1.5")));
        }

        root.Add(edgeLayer);

        foreach (NodePlacement placement in placements.OrderBy(candidate => candidate.Node.OrderKey)
                     .ThenBy(candidate => candidate.Node.NodeId, StringComparer.Ordinal))
        {
            string safeId = MermaidIdSanitizer.Sanitize(placement.Node.NodeId);
            DiagramForestNodeMetrics metrics = DiagramForestNodeMetricsCalculator.Measure(
                placement.Node,
                options);
            XElement nodeGroup = DiagramForestNodeSvgEmitter.Emit(
                svgNamespace,
                safeId,
                placement.Width,
                placement.Height,
                metrics,
                options);
            nodeGroup.Add(new XAttribute(
                "transform",
                string.Create(
                    CultureInfo.InvariantCulture,
                    $"translate({placement.X:0.###},{placement.Y:0.###})")));
            root.Add(nodeGroup);
        }

        return root.ToString(SaveOptions.DisableFormatting);
    }

    private static (double FromX, double FromY, double ToX, double ToY) ResolveEdgeEndpoints(
        NodePlacement fromPlacement,
        NodePlacement toPlacement)
    {
        double fromCenterX = fromPlacement.X + (fromPlacement.Width / 2.0);
        double fromCenterY = fromPlacement.Y + (fromPlacement.Height / 2.0);
        double toCenterX = toPlacement.X + (toPlacement.Width / 2.0);
        double toCenterY = toPlacement.Y + (toPlacement.Height / 2.0);
        double deltaX = toCenterX - fromCenterX;
        double deltaY = toCenterY - fromCenterY;

        if (Math.Abs(deltaX) >= Math.Abs(deltaY))
        {
            if (deltaX >= 0)
            {
                return (
                    fromPlacement.X + fromPlacement.Width,
                    fromCenterY,
                    toPlacement.X,
                    toCenterY);
            }

            return (
                fromPlacement.X,
                fromCenterY,
                toPlacement.X + toPlacement.Width,
                toCenterY);
        }

        if (deltaY >= 0)
        {
            return (
                fromCenterX,
                fromPlacement.Y + fromPlacement.Height,
                toCenterX,
                toPlacement.Y);
        }

        return (
            fromCenterX,
            fromPlacement.Y,
            toCenterX,
            toPlacement.Y + toPlacement.Height);
    }

    private static List<DiagramNode> OrderNodesAlongFlow(
        IReadOnlyList<DiagramNode> component,
        IReadOnlyList<DiagramEdge> visibleEdges)
    {
        if (component.Count <= 1)
        {
            return component.ToList();
        }

        HashSet<string> memberIds = component
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);
        List<DiagramEdge> internalEdges = visibleEdges
            .Where(edge => memberIds.Contains(edge.FromNodeId) && memberIds.Contains(edge.ToNodeId))
            .ToList();
        Dictionary<string, int> inDegree = component.ToDictionary(
            node => node.NodeId,
            _ => 0,
            StringComparer.Ordinal);

        foreach (DiagramEdge edge in internalEdges)
        {
            inDegree[edge.ToNodeId]++;
        }

        Queue<DiagramNode> queue = new(component
            .Where(node => inDegree[node.NodeId] == 0)
            .OrderBy(node => node.OrderKey)
            .ThenBy(node => node.NodeId, StringComparer.Ordinal));
        List<DiagramNode> ordered = [];
        Dictionary<string, List<string>> outgoing = new(StringComparer.Ordinal);

        foreach (DiagramEdge edge in internalEdges)
        {
            if (!outgoing.TryGetValue(edge.FromNodeId, out List<string>? targets))
            {
                targets = [];
                outgoing[edge.FromNodeId] = targets;
            }

            targets.Add(edge.ToNodeId);
        }

        while (queue.Count > 0)
        {
            DiagramNode current = queue.Dequeue();
            ordered.Add(current);

            if (!outgoing.TryGetValue(current.NodeId, out List<string>? targets))
            {
                continue;
            }

            foreach (string targetId in targets.OrderBy(id => id, StringComparer.Ordinal))
            {
                inDegree[targetId]--;

                if (inDegree[targetId] == 0)
                {
                    DiagramNode? targetNode = component.FirstOrDefault(node =>
                        string.Equals(node.NodeId, targetId, StringComparison.Ordinal));

                    if (targetNode is not null)
                    {
                        queue.Enqueue(targetNode);
                    }
                }
            }
        }

        if (ordered.Count < component.Count)
        {
            foreach (DiagramNode node in component
                         .Where(node => !ordered.Any(existing =>
                             string.Equals(existing.NodeId, node.NodeId, StringComparison.Ordinal)))
                         .OrderBy(node => node.OrderKey)
                         .ThenBy(node => node.NodeId, StringComparer.Ordinal))
            {
                ordered.Add(node);
            }
        }

        return ordered;
    }

    private static string FormatCoordinate(double value)
    {
        return value.ToString("0.###", CultureInfo.InvariantCulture);
    }

    private sealed record ComponentLayout(
        int RowIndex,
        int ColumnIndex,
        IReadOnlyList<NodePlacement> RelativePlacements,
        double Width,
        double Height);
}
