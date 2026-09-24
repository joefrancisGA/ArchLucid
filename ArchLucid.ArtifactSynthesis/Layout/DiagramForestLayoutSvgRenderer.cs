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
        double Height,
        DiagramForestNodeMetrics Metrics,
        string? FrameCellId = null,
        int DataFlowColumnIndex = -1);

    public DiagramForestLayoutResult Render(DiagramAst ast, DiagramForestLayoutOptions? options = null)
    {
        ArgumentNullException.ThrowIfNull(ast);

        DiagramForestLayoutOptions resolvedOptions = options ?? new DiagramForestLayoutOptions();
        List<DiagramNode> renderableNodes = ast.Nodes
            .Where(node => !IsPackingSubgraphMember(ast, node))
            .Where(DiagramExecutiveOverflowCanvasExclusion.IsCanvasRenderableNode)
            .OrderBy(node => node.OrderKey)
            .ThenBy(node => node.NodeId, StringComparer.Ordinal)
            .ToList();

        if (renderableNodes.Count == 0)
        {
            return DiagramForestLayoutResult.Failed("Diagram AST contained no renderable nodes.");
        }

        IReadOnlyList<DiagramEdge> visibleEdges = DiagramExecutiveOverflowCanvasExclusion
            .CanvasVisibleEdges(ast.Nodes, ast.Edges)
            .ToList();
        DiagramForestSingletonTailPlanner.Result singletonResult =
            DiagramForestSingletonTailPlanner.Apply(ast.Title, renderableNodes, visibleEdges);
        renderableNodes = singletonResult.Nodes.ToList();
        visibleEdges = singletonResult.Edges;

        DiagramForestCanvasLabelContext labelContext = DiagramForestCanvasLabelContext.Create(
            renderableNodes,
            resolvedOptions);
        // Visio-style: resource groups are the canvas containers. Peering and
        // other edges still route between boxes after placement.
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> resourceGroupCells =
            DiagramResourceGroupCellFlowPlanner.OrderCells(
                DiagramResourceGroupPacker.PartitionCells(renderableNodes),
                visibleEdges);

        List<NodePlacement> placements;
        IReadOnlyList<DiagramForestDataFlowColumnLayout.ColumnInfo>? dataFlowColumns = null;

        if (IsDataFlowTitle(ast.Title))
        {
            DiagramForestDataFlowColumnLayout.Result dataFlowLayout = DiagramForestDataFlowColumnLayout.Plan(
                renderableNodes,
                ast.Subgraphs,
                resolvedOptions,
                labelContext,
                visibleEdges);
            dataFlowColumns = dataFlowLayout.Columns;
            placements = dataFlowLayout.Placements
                .Select(placement => new NodePlacement(
                    placement.Node,
                    placement.X,
                    placement.Y,
                    placement.Width,
                    placement.Height,
                    placement.Metrics,
                    FrameCellId: null,
                    DataFlowColumnIndex: placement.ColumnIndex))
                .ToList();
        }
        else
        {
            List<ComponentLayout> componentLayouts = BuildResourceGroupCellLayouts(
                resourceGroupCells,
                visibleEdges,
                resolvedOptions,
                labelContext);

            if (componentLayouts.Count == 0)
            {
                return DiagramForestLayoutResult.Failed("Forest layout produced no component placements.");
            }

            placements = PlaceNodes(componentLayouts, resolvedOptions);
        }

        if (placements.Count == 0)
        {
            return DiagramForestLayoutResult.Failed("Forest layout produced no component placements.");
        }

        string svg = EmitSvg(placements, visibleEdges, renderableNodes, ast.Title, resolvedOptions, dataFlowColumns);

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

    private static bool IsDataFlowTitle(string title)
    {
        return title.Contains("(DataFlow)", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPackingSubgraphMember(DiagramAst ast, DiagramNode node)
    {
        ArgumentNullException.ThrowIfNull(ast);

        if (node is null || string.IsNullOrWhiteSpace(node.SubgraphId))
        {
            return false;
        }

        DiagramSubgraph? subgraph = ast.Subgraphs.FirstOrDefault(candidate =>
            string.Equals(candidate.SubgraphId, node.SubgraphId, StringComparison.Ordinal));

        return subgraph is not null && DiagramSparseComponentPacker.IsPackingSubgraph(subgraph);
    }

    private static List<ComponentLayout> BuildResourceGroupCellLayouts(
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> cells,
        IReadOnlyList<DiagramEdge> visibleEdges,
        DiagramForestLayoutOptions options,
        DiagramForestCanvasLabelContext labelContext)
    {
        ArgumentNullException.ThrowIfNull(cells);

        IReadOnlyList<IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell>> layers =
            DiagramResourceGroupCellFlowPlanner.GroupByLayers(cells, visibleEdges);

        if (layers.Count > 1)
        {
            return BuildLayeredResourceGroupCellLayouts(layers, visibleEdges, options, labelContext);
        }

        List<ComponentLayout> layouts = [];
        int columnCount = DiagramComponentRowPlanner.ResolveColumnCount(cells.Count);

        for (int cellIndex = 0; cellIndex < cells.Count; cellIndex++)
        {
            DiagramResourceGroupPacker.ResourceGroupCell cell = cells[cellIndex];

            if (cell is null || cell.Nodes is null || cell.Nodes.Count == 0)
            {
                continue;
            }

            int rowIndex = cellIndex / columnCount;
            int columnIndex = cellIndex % columnCount;
            layouts.Add(BuildSingleCellLayout(
                cell,
                rowIndex,
                columnIndex,
                visibleEdges,
                options,
                labelContext));
        }

        return layouts;
    }

    private static List<ComponentLayout> BuildLayeredResourceGroupCellLayouts(
        IReadOnlyList<IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell>> layers,
        IReadOnlyList<DiagramEdge> visibleEdges,
        DiagramForestLayoutOptions options,
        DiagramForestCanvasLabelContext labelContext)
    {
        ArgumentNullException.ThrowIfNull(layers);

        List<ComponentLayout> layouts = [];

        for (int columnIndex = 0; columnIndex < layers.Count; columnIndex++)
        {
            IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> layer = layers[columnIndex];

            if (layer is null)
            {
                continue;
            }

            for (int rowIndex = 0; rowIndex < layer.Count; rowIndex++)
            {
                DiagramResourceGroupPacker.ResourceGroupCell cell = layer[rowIndex];

                if (cell is null || cell.Nodes is null || cell.Nodes.Count == 0)
                {
                    continue;
                }

                layouts.Add(BuildSingleCellLayout(
                    cell,
                    rowIndex,
                    columnIndex,
                    visibleEdges,
                    options,
                    labelContext));
            }
        }

        return layouts;
    }

    private static ComponentLayout BuildSingleCellLayout(
        DiagramResourceGroupPacker.ResourceGroupCell cell,
        int rowIndex,
        int columnIndex,
        IReadOnlyList<DiagramEdge> visibleEdges,
        DiagramForestLayoutOptions options,
        DiagramForestCanvasLabelContext labelContext)
    {
        string componentKey = $"{rowIndex}_{columnIndex}";
        List<NodePlacement> relativePlacements = LayoutResourceGroupCell(
            cell,
            componentKey,
            cellIndex: 0,
            visibleEdges,
            options,
            labelContext);
        (double width, double height) = ResolveCellOuterSize(relativePlacements, options);

        return new ComponentLayout(
            RowIndex: rowIndex,
            ColumnIndex: columnIndex,
            RelativePlacements: relativePlacements,
            Width: width,
            Height: height);
    }

    private static List<NodePlacement> PackIslandPlacements(
        IReadOnlyList<IReadOnlyList<DiagramNode>> islands,
        IReadOnlyList<DiagramEdge> visibleEdges,
        DiagramForestLayoutOptions options,
        DiagramForestCanvasLabelContext labelContext)
    {
        ArgumentNullException.ThrowIfNull(islands);

        List<NodePlacement> placements = [];
        double islandX = 0.0d;
        double rowY = 0.0d;
        double rowHeight = 0.0d;

        foreach (IReadOnlyList<DiagramNode> island in islands)
        {
            if (island is null || island.Count == 0)
            {
                continue;
            }

            List<NodePlacement> islandPlacements = LayoutCellInterior(
                island,
                visibleEdges,
                options,
                labelContext);
            (double islandWidth, double islandHeight) = ResolveCellOuterSize(islandPlacements, options);

            if (islandX > 0.0d && islandX + islandWidth > options.MaxNodeWidth * 3)
            {
                islandX = 0.0d;
                rowY += rowHeight + options.ComponentVerticalGap;
                rowHeight = 0.0d;
            }

            foreach (NodePlacement relative in islandPlacements)
            {
                placements.Add(relative with
                {
                    X = islandX + relative.X,
                    Y = rowY + relative.Y,
                });
            }

            islandX += islandWidth + options.ComponentHorizontalGap;
            rowHeight = Math.Max(rowHeight, islandHeight);
        }

        return placements;
    }

    private static (double Width, double Height) ResolveCellOuterSize(
        IReadOnlyList<NodePlacement> placements,
        DiagramForestLayoutOptions options)
    {
        if (placements.Count == 0)
        {
            return (options.UniformNodeWidth, options.NodeHeight);
        }

        double width = placements.Max(placement => placement.X + placement.Width);
        double height = placements.Max(placement => placement.Y + placement.Height);

        if (placements.Any(placement => !string.IsNullOrWhiteSpace(placement.FrameCellId)))
        {
            width += DiagramForestResourceGroupFrameStyle.Pad;
            height += DiagramForestResourceGroupFrameStyle.Pad;
        }

        return (width, height);
    }

    private static List<NodePlacement> LayoutResourceGroupCell(
        DiagramResourceGroupPacker.ResourceGroupCell cell,
        string componentKey,
        int cellIndex,
        IReadOnlyList<DiagramEdge> visibleEdges,
        DiagramForestLayoutOptions options,
        DiagramForestCanvasLabelContext labelContext)
    {
        ArgumentNullException.ThrowIfNull(cell);

        if (cell.Nodes is null || cell.Nodes.Count == 0)
        {
            return [];
        }

        List<List<DiagramNode>> islands = DiagramComponentBuilder.BuildConnectedComponents(
            cell.Nodes,
            visibleEdges);
        List<IReadOnlyList<DiagramNode>> orderedIslands = DiagramComponentRowPlanner.OrderComponents(islands);
        List<NodePlacement> interiorPlacements = orderedIslands.Count <= 1
            ? LayoutCellInterior(cell.Nodes, visibleEdges, options, labelContext)
            : PackIslandPlacements(orderedIslands, visibleEdges, options, labelContext);

        if (!DiagramResourceGroupPacker.ShouldDrawFrame(cell))
        {
            return interiorPlacements;
        }

        string frameCellId = DiagramResourceGroupPacker.BuildFrameCellId(componentKey, cellIndex);
        double innerWidth = interiorPlacements.Count == 0
            ? options.UniformNodeWidth
            : interiorPlacements.Max(placement => placement.X + placement.Width);
        double innerHeight = interiorPlacements.Count == 0
            ? options.NodeHeight
            : interiorPlacements.Max(placement => placement.Y + placement.Height);
        double offsetX = DiagramForestResourceGroupFrameStyle.Pad;
        double offsetY = DiagramForestResourceGroupFrameStyle.LabelBand;

        return interiorPlacements
            .Select(placement => placement with
            {
                X = placement.X + offsetX,
                Y = placement.Y + offsetY,
                FrameCellId = frameCellId,
            })
            .ToList();
    }

    private static List<NodePlacement> LayoutCellInterior(
        IReadOnlyList<DiagramNode> cellNodes,
        IReadOnlyList<DiagramEdge> visibleEdges,
        DiagramForestLayoutOptions options,
        DiagramForestCanvasLabelContext labelContext)
    {
        if (ShouldUseRoleColumns(cellNodes))
        {
            return LayoutRoleColumns(cellNodes, options, labelContext);
        }

        if (DiagramHubSpokeLayerPlanner.ShouldLayoutHubSpoke(cellNodes, visibleEdges))
        {
            return LayoutHubSpoke(cellNodes, visibleEdges, options, labelContext);
        }

        if (DiagramLeftToRightLayerPlanner.ShouldLayoutLeftToRight(cellNodes))
        {
            return LayoutLeftToRight(cellNodes, visibleEdges, options, labelContext);
        }

        return LayoutTopDown(cellNodes, visibleEdges, options, labelContext);
    }

    private static bool ShouldUseRoleColumns(IReadOnlyList<DiagramNode> nodes)
    {
        return nodes.Count >= 4
            && nodes.All(node => string.IsNullOrWhiteSpace(node.SubgraphId));
    }

    private static List<NodePlacement> LayoutRoleColumns(
        IReadOnlyList<DiagramNode> nodes,
        DiagramForestLayoutOptions options,
        DiagramForestCanvasLabelContext labelContext)
    {
        List<NodePlacement> placements = [];
        double columnX = 0.0d;

        foreach (IGrouping<int, DiagramNode> role in DiagramForestRoleClassifier
                     .Order(nodes)
                     .GroupBy(DiagramForestRoleClassifier.ResolveOrder)
                     .OrderBy(group => group.Key))
        {
            List<(DiagramNode Node, DiagramForestNodeMetrics Metrics)> sized = role
                .Select(node => (
                    Node: node,
                    Metrics: DiagramForestNodeMetricsCalculator.Measure(node, options, labelContext)))
                .ToList();
            double columnWidth = sized.Max(item => item.Metrics.Width);
            double nodeY = 0.0d;

            foreach ((DiagramNode node, DiagramForestNodeMetrics metrics) in sized)
            {
                placements.Add(new NodePlacement(
                    node,
                    columnX + ((columnWidth - metrics.Width) / 2.0d),
                    nodeY,
                    metrics.Width,
                    metrics.Height,
                    metrics));
                nodeY += metrics.Height + options.NodeVerticalGap;
            }

            columnX += columnWidth + options.NodeHorizontalGap;
        }

        return placements;
    }

    private static List<NodePlacement> LayoutHubSpoke(
        IReadOnlyList<DiagramNode> component,
        IReadOnlyList<DiagramEdge> visibleEdges,
        DiagramForestLayoutOptions options,
        DiagramForestCanvasLabelContext labelContext)
    {
        DiagramNode hub = DiagramHubSpokeLayerPlanner.ResolveHub(component, visibleEdges)
            ?? component.OrderBy(node => node.OrderKey).ThenBy(node => node.NodeId, StringComparer.Ordinal).First();
        IReadOnlyList<DiagramNode> spokes = DiagramHubSpokeLayerPlanner.OrderSpokes(hub, component, visibleEdges);
        List<NodePlacement> spokePlacements = [];
        double spokeY = 0.0d;
        double spokeColumnWidth = 0.0d;

        foreach (DiagramNode spoke in spokes)
        {
            DiagramForestNodeMetrics metrics = DiagramForestNodeMetricsCalculator.Measure(spoke, options, labelContext);
            spokePlacements.Add(new NodePlacement(spoke, 0, spokeY, metrics.Width, metrics.Height, metrics));
            spokeColumnWidth = Math.Max(spokeColumnWidth, metrics.Width);
            spokeY += metrics.Height + options.NodeVerticalGap;
        }

        DiagramForestNodeMetrics hubMetrics = DiagramForestNodeMetricsCalculator.Measure(hub, options, labelContext);
        double spokeStackHeight = spokeY > 0.0d ? spokeY - options.NodeVerticalGap : hubMetrics.Height;
        double hubY = Math.Max(0.0d, (spokeStackHeight - hubMetrics.Height) / 2.0d);
        double hubX = spokeColumnWidth + options.NodeHorizontalGap;
        List<NodePlacement> placements = spokePlacements
            .Select(placement => placement with { X = (spokeColumnWidth - placement.Width) / 2.0d })
            .ToList();
        placements.Add(new NodePlacement(hub, hubX, hubY, hubMetrics.Width, hubMetrics.Height, hubMetrics));

        return placements;
    }

    private static List<NodePlacement> LayoutTopDown(
        IReadOnlyList<DiagramNode> component,
        IReadOnlyList<DiagramEdge> visibleEdges,
        DiagramForestLayoutOptions options,
        DiagramForestCanvasLabelContext labelContext)
    {
        List<DiagramNode> orderedNodes = DiagramForestRoleClassifier
            .Order(OrderNodesAlongFlow(component, visibleEdges))
            .ToList();
        List<NodePlacement> placements = [];
        double nodeY = 0;

        foreach (DiagramNode node in orderedNodes)
        {
            DiagramForestNodeMetrics metrics = DiagramForestNodeMetricsCalculator.Measure(node, options, labelContext);
            placements.Add(new NodePlacement(node, 0, nodeY, metrics.Width, metrics.Height, metrics));
            nodeY += metrics.Height + options.NodeVerticalGap;
        }

        double maxWidth = placements.Count == 0 ? options.UniformNodeWidth : placements.Max(placement => placement.Width);

        return placements
            .Select(placement => placement with { X = (maxWidth - placement.Width) / 2.0d })
            .ToList();
    }

    private static List<NodePlacement> LayoutLeftToRight(
        IReadOnlyList<DiagramNode> component,
        IReadOnlyList<DiagramEdge> visibleEdges,
        DiagramForestLayoutOptions options,
        DiagramForestCanvasLabelContext labelContext)
    {
        IReadOnlyList<IReadOnlyList<DiagramNode>> layers =
            DiagramLeftToRightLayerPlanner.AssignLayers(component, visibleEdges);
        List<NodePlacement> placements = [];
        double columnX = 0;

        foreach (IReadOnlyList<DiagramNode> layer in layers)
        {
            List<(DiagramNode Node, DiagramForestNodeMetrics Metrics)> sized = layer
                .Select(node => (
                    Node: node,
                    Metrics: DiagramForestNodeMetricsCalculator.Measure(node, options, labelContext)))
                .ToList();
            double columnWidth = sized.Count == 0 ? options.UniformNodeWidth : sized.Max(item => item.Metrics.Width);
            double nodeY = 0;

            foreach ((DiagramNode node, DiagramForestNodeMetrics metrics) in sized)
            {
                double nodeX = columnX + ((columnWidth - metrics.Width) / 2.0);
                placements.Add(new NodePlacement(node, nodeX, nodeY, metrics.Width, metrics.Height, metrics));
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
        IReadOnlyList<DiagramNode> renderableNodes,
        string title,
        DiagramForestLayoutOptions options,
        IReadOnlyList<DiagramForestDataFlowColumnLayout.ColumnInfo>? dataFlowColumns = null)
    {
        if (placements.Count == 0)
        {
            return string.Empty;
        }

        Dictionary<string, NodePlacement> placementById = placements.ToDictionary(
            placement => placement.Node.NodeId,
            StringComparer.Ordinal);
        List<DiagramResourceGroupPacker.NodePlacementBounds> placementBounds = placements
            .Select(placement => new DiagramResourceGroupPacker.NodePlacementBounds(
                placement.Node,
                placement.X,
                placement.Y,
                placement.Width,
                placement.Height,
                placement.FrameCellId))
            .ToList();
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupFrameBounds> frameBounds =
            DiagramResourceGroupPacker.ResolveFrameBounds(placementBounds);
        IReadOnlyList<DiagramForestNestedFrameBounds> nestedFrameBounds =
            DiagramForestNestedFrameResolver.Resolve(renderableNodes, placementBounds, visibleEdges);
        DiagramForestNestedFrameBounds? subscriptionFrame =
            DiagramForestSubscriptionFrameResolver.Resolve(title, placementBounds);
        bool isDataFlow = IsDataFlowTitle(title) && dataFlowColumns is not null;
        double minX = placements.Min(placement => placement.X) - options.Padding;
        double minY = isDataFlow
            ? options.Padding
            : placements.Min(placement => placement.Y) - options.Padding;
        double maxX = placements.Max(placement => placement.X + placement.Width) + options.Padding;
        double maxY = placements.Max(placement => placement.Y + placement.Height) + options.Padding;

        if (frameBounds.Count > 0)
        {
            minX = Math.Min(minX, frameBounds.Min(frame => frame.X) - options.Padding);
            minY = Math.Min(minY, frameBounds.Min(frame => frame.Y) - options.Padding);
            maxX = Math.Max(maxX, frameBounds.Max(frame => frame.X + frame.Width) + options.Padding);
            maxY = Math.Max(maxY, frameBounds.Max(frame => frame.Y + frame.Height) + options.Padding);
        }

        if (nestedFrameBounds.Count > 0)
        {
            minX = Math.Min(minX, nestedFrameBounds.Min(frame => frame.X) - options.Padding);
            minY = Math.Min(minY, nestedFrameBounds.Min(frame => frame.Y) - options.Padding);
            maxX = Math.Max(maxX, nestedFrameBounds.Max(frame => frame.X + frame.Width) + options.Padding);
            maxY = Math.Max(maxY, nestedFrameBounds.Max(frame => frame.Y + frame.Height) + options.Padding);
        }

        if (subscriptionFrame is not null)
        {
            minX = Math.Min(minX, subscriptionFrame.X - options.Padding);
            minY = Math.Min(minY, subscriptionFrame.Y - options.Padding);
            maxX = Math.Max(maxX, subscriptionFrame.X + subscriptionFrame.Width + options.Padding);
            maxY = Math.Max(maxY, subscriptionFrame.Y + subscriptionFrame.Height + options.Padding);
        }

        HashSet<string> suppressedEdgeKeys = DiagramForestEdgeLabelCollapse.ResolveSuppressedEdgeKeys(
            renderableNodes,
            visibleEdges);
        Dictionary<string, IReadOnlyList<DiagramNode>> componentByNodeId =
            BuildComponentMembership(renderableNodes, visibleEdges);
        Dictionary<string, DiagramNode> nodesById = renderableNodes.ToDictionary(
            node => node.NodeId,
            StringComparer.Ordinal);
        bool hasDashedPeering = visibleEdges.Any(DiagramForestEdgeLabelCollapse.IsPeeringEdge);
        bool hasPrivateEndpointAccess = placements.Any(placement => placement.Metrics.HasPrivateEndpointAccess);
        IReadOnlyList<DiagramInventoryPictogramKind> usedKinds =
            DiagramForestLegendSvgEmitter.CollectUsedKinds(placements.Select(placement => placement.Metrics).ToList());

        XNamespace svgNamespace = "http://www.w3.org/2000/svg";
        XElement root = new(
            svgNamespace + "svg",
            new XAttribute("xmlns", svgNamespace.NamespaceName));

        DiagramForestEdgeArrowMarkerSvgEmitter.EmitDefs(svgNamespace, root);

        if (frameBounds.Count > 0)
        {
            root.Add(DiagramForestResourceGroupFrameSvgEmitter.EmitLayer(svgNamespace, frameBounds));
        }

        if (subscriptionFrame is not null || nestedFrameBounds.Count > 0)
        {
            List<DiagramForestNestedFrameBounds> containerFrames = [];

            if (subscriptionFrame is not null)
            {
                containerFrames.Add(subscriptionFrame);
            }

            containerFrames.AddRange(nestedFrameBounds);
            root.Add(DiagramForestNestedFrameSvgEmitter.EmitLayer(svgNamespace, containerFrames));
        }

        if (isDataFlow && dataFlowColumns is not null && dataFlowColumns.Count > 0)
        {
            root.Add(DiagramForestDataFlowStageLabelSvgEmitter.EmitLayer(svgNamespace, dataFlowColumns, options));
        }

        XElement edgeLayer = new(svgNamespace + "g", new XAttribute("class", "edges"));
        List<(double X, double Y)> placedLabelCenters = [];
        List<IReadOnlyList<(double X1, double Y1, double X2, double Y2)>> alreadyRouted = [];

        foreach (DiagramEdge edge in visibleEdges)
        {
            string routeFromNodeId = edge.FromNodeId;
            string routeToNodeId = edge.ToNodeId;

            if (DiagramForestEdgeLabelCollapse.IsPeeringEdge(edge)
                && componentByNodeId.TryGetValue(edge.FromNodeId, out IReadOnlyList<DiagramNode>? component))
            {
                (routeFromNodeId, routeToNodeId) = DiagramForestPeeringEdgeDirector.ResolveClientToServerEndpoints(
                    edge,
                    component,
                    nodesById,
                    visibleEdges);
            }

            if (!placementById.TryGetValue(routeFromNodeId, out NodePlacement? fromPlacement)
                || !placementById.TryGetValue(routeToNodeId, out NodePlacement? toPlacement))
            {
                continue;
            }

            DiagramForestOrthogonalEdgeRouter.RouteResult? route;

            if (isDataFlow && dataFlowColumns is not null)
            {
                DiagramForestDataFlowColumnLayout.NodePlacement fromDataFlow = new(
                    fromPlacement.Node,
                    fromPlacement.X,
                    fromPlacement.Y,
                    fromPlacement.Width,
                    fromPlacement.Height,
                    fromPlacement.Metrics,
                    fromPlacement.DataFlowColumnIndex);
                DiagramForestDataFlowColumnLayout.NodePlacement toDataFlow = new(
                    toPlacement.Node,
                    toPlacement.X,
                    toPlacement.Y,
                    toPlacement.Width,
                    toPlacement.Height,
                    toPlacement.Metrics,
                    toPlacement.DataFlowColumnIndex);
                route = DiagramForestDataFlowEdgeRouter.TryRoute(
                    fromDataFlow,
                    toDataFlow,
                    dataFlowColumns,
                    placementBounds,
                    routeFromNodeId,
                    routeToNodeId,
                    options);

                if (route is null)
                {
                    continue;
                }
            }
            else
            {
                (double fromX, double fromY, double toX, double toY) = ResolveEdgeEndpoints(fromPlacement, toPlacement);
                IReadOnlyList<DiagramForestOrthogonalEdgeRouter.Rect> obstacles =
                    DiagramForestOrthogonalEdgeRouter.BuildObstacles(
                        placementBounds,
                        routeFromNodeId,
                        routeToNodeId);
                double? extraVerticalChannelX = fromX <= toX
                    ? fromX + options.NodeHorizontalGap
                    : fromX - options.NodeHorizontalGap;
                route = DiagramForestOrthogonalEdgeRouter.Route(
                    fromX,
                    fromY,
                    toX,
                    toY,
                    obstacles,
                    alreadyRouted,
                    extraVerticalChannelX);
            }

            alreadyRouted.Add(route.Segments);
            bool suppressOnPathLabel = DiagramForestEdgeLabelCollapse.ShouldSuppressOnPathLabel(
                edge,
                suppressedEdgeKeys);
            bool showArrow = true;

            edgeLayer.Add(DiagramForestEdgeLabelSvgEmitter.EmitEdgeGroup(
                svgNamespace,
                edge,
                route,
                suppressOnPathLabel,
                showArrow,
                placedLabelCenters));
        }

        root.Add(edgeLayer);

        foreach (NodePlacement placement in placements.OrderBy(candidate => candidate.Node.OrderKey)
                     .ThenBy(candidate => candidate.Node.NodeId, StringComparer.Ordinal))
        {
            string safeId = MermaidIdSanitizer.Sanitize(placement.Node.NodeId);
            XElement nodeGroup = DiagramForestNodeSvgEmitter.Emit(
                svgNamespace,
                safeId,
                placement.Width,
                placement.Height,
                placement.Metrics,
                options);
            nodeGroup.Add(new XAttribute(
                "transform",
                string.Create(
                    CultureInfo.InvariantCulture,
                    $"translate({placement.X:0.###},{placement.Y:0.###})")));
            root.Add(nodeGroup);
        }

        double legendAnchorX = minX + 16.0d;
        double legendAnchorY = maxY + 12.0d;
        DiagramForestLegendSvgEmitter.LegendLayout legendLayout = DiagramForestLegendSvgEmitter.Emit(
            svgNamespace,
            new DiagramForestLegendSvgEmitter.LegendInput(
                usedKinds,
                hasPrivateEndpointAccess,
                hasDashedPeering,
                frameBounds.Count > 0),
            legendAnchorX,
            legendAnchorY);
        root.Add(legendLayout.Group);

        maxY = Math.Max(maxY, legendAnchorY + legendLayout.Height + options.Padding);
        double viewBoxWidth = Math.Max(1, maxX - minX);
        double viewBoxHeight = Math.Max(1, maxY - minY);
        root.Add(new XAttribute(
            "viewBox",
            string.Create(
                CultureInfo.InvariantCulture,
                $"{minX:0.###} {minY:0.###} {viewBoxWidth:0.###} {viewBoxHeight:0.###}")));

        return root.ToString(SaveOptions.DisableFormatting);
    }

    private static Dictionary<string, IReadOnlyList<DiagramNode>> BuildComponentMembership(
        IReadOnlyList<DiagramNode> nodes,
        IReadOnlyList<DiagramEdge> visibleEdges)
    {
        List<List<DiagramNode>> components = DiagramComponentBuilder.BuildConnectedComponents(nodes, visibleEdges);
        Dictionary<string, IReadOnlyList<DiagramNode>> componentByNodeId = new(StringComparer.Ordinal);

        foreach (List<DiagramNode> component in components)
        {
            foreach (DiagramNode node in component)
            {
                componentByNodeId[node.NodeId] = component;
            }
        }

        return componentByNodeId;
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

    private sealed record ComponentLayout(
        int RowIndex,
        int ColumnIndex,
        IReadOnlyList<NodePlacement> RelativePlacements,
        double Width,
        double Height);
}
