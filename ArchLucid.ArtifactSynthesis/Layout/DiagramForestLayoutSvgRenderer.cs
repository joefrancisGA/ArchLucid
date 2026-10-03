using System.Globalization;
using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.KnowledgeGraph;

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
        int DataFlowColumnIndex = -1,
        string? VnetFrameId = null,
        bool IsFrameAnchor = false);

    private sealed record VnetPrimaryGroup(
        string NodeId,
        DiagramNode Vnet,
        IReadOnlyList<DiagramNode> Members,
        IReadOnlyList<NodePlacement> Placements,
        double Width,
        double Height);

    private sealed record VnetRemainderCell(
        DiagramResourceGroupPacker.ResourceGroupCell Cell,
        IReadOnlyList<NodePlacement> Placements,
        double Width,
        double Height,
        IReadOnlyDictionary<string, int> VnetConnectionCounts);

    private sealed record FrameEdgeRoute(
        double FromX,
        double FromY,
        double ToX,
        double ToY);

    private sealed record BundleEndpointIds(
        IReadOnlyList<string> FromNodeIds,
        IReadOnlyList<string> ToNodeIds);

    private sealed record NeighborhoodMetadata(
        string Id,
        string Kind,
        string Title,
        IReadOnlyList<NodePlacement> Members,
        IReadOnlyList<string> FrameIds,
        IReadOnlyList<(string Name, int Count)> Types);

    private sealed record NeighborhoodLink(string From, string To, int Count);

    private sealed record NeighborhoodMap(
        IReadOnlyList<NeighborhoodMetadata> Neighborhoods,
        IReadOnlyList<NeighborhoodLink> Links);

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

        IReadOnlyList<DiagramEdge> visibleEdges = DiagramCrossGroupFanOutCanvasExclusion
            .FilterCanvasEdges(
                renderableNodes,
                DiagramExecutiveOverflowCanvasExclusion.CanvasVisibleEdges(ast.Nodes, ast.Edges),
                resolvedOptions.IncludeCrossGroupFanOut || IsDataFlowTitle(ast.Title))
            .ToList();
        DiagramForestSingletonTailPlanner.Result singletonResult =
            DiagramForestSingletonTailPlanner.Apply(ast.Title, renderableNodes, visibleEdges);
        renderableNodes = singletonResult.Nodes.ToList();
        visibleEdges = singletonResult.Edges;

        DiagramForestCanvasLabelContext labelContext = DiagramForestCanvasLabelContext.Create(
            renderableNodes,
            resolvedOptions,
            visibleEdges,
            IsDataFlowTitle(ast.Title));
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
            placements = IsVnetPrimaryTitle(ast.Title)
                ? BuildVnetPrimaryPlacements(
                    renderableNodes,
                    resourceGroupCells,
                    visibleEdges,
                    resolvedOptions,
                    labelContext,
                    ast.Title)
                : PlaceNodes(
                    BuildResourceGroupCellLayouts(
                        resourceGroupCells,
                        visibleEdges,
                        resolvedOptions,
                        labelContext,
                        ast.Title),
                    resolvedOptions);

            if (placements.Count == 0)
            {
                return DiagramForestLayoutResult.Failed("Forest layout produced no component placements.");
            }
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

    private static bool IsVnetPrimaryTitle(string title)
    {
        return title.Contains("(FullSubscription)", StringComparison.OrdinalIgnoreCase)
            || title.Contains("(Network)", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsDataInventoryTitle(string title)
    {
        return title.Contains("(Data)", StringComparison.OrdinalIgnoreCase)
            && !IsDataFlowTitle(title);
    }

    private static bool IsDataOrStorageNode(DiagramNode node)
    {
        string armType = node.ArmResourceType ?? string.Empty;
        return armType.Contains("Microsoft.Storage/", StringComparison.OrdinalIgnoreCase)
            || armType.Contains("Microsoft.Sql/", StringComparison.OrdinalIgnoreCase)
            || armType.Contains("Microsoft.DocumentDB/", StringComparison.OrdinalIgnoreCase)
            || armType.Contains("Microsoft.DBfor", StringComparison.OrdinalIgnoreCase)
            || armType.Contains("Microsoft.Cache/", StringComparison.OrdinalIgnoreCase)
            || armType.Contains("Microsoft.Synapse/", StringComparison.OrdinalIgnoreCase)
            || armType.Contains("Microsoft.DataFactory/", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsInteriorVnetPlacementEdge(
        DiagramEdge edge,
        IReadOnlyList<NodePlacement> placements)
    {
        if (DiagramForestEdgeLabelCollapse.IsPeeringEdge(edge) || !IsInVerb(edge.Label))
        {
            return false;
        }

        NodePlacement? from = placements.FirstOrDefault(placement =>
            string.Equals(placement.Node.NodeId, edge.FromNodeId, StringComparison.Ordinal));
        NodePlacement? to = placements.FirstOrDefault(placement =>
            string.Equals(placement.Node.NodeId, edge.ToNodeId, StringComparison.Ordinal));
        return from is not null
            && to is not null
            && !string.IsNullOrWhiteSpace(from.VnetFrameId)
            && string.Equals(from.VnetFrameId, to.VnetFrameId, StringComparison.Ordinal);
    }

    private const string SharedServicesFrameCellId = "shared-services";
    private const string SharedServicesFrameTitle = "Shared services";

    private static List<NodePlacement> BuildVnetPrimaryPlacements(
        IReadOnlyList<DiagramNode> nodes,
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> resourceGroupCells,
        IReadOnlyList<DiagramEdge> visibleEdges,
        DiagramForestLayoutOptions options,
        DiagramForestCanvasLabelContext labelContext,
        string diagramTitle)
    {
        List<DiagramNode> sharedServiceNodes = nodes
            .Where(node => DiagramSharedServiceCatalog.IsSharedService(node.ArmResourceType))
            .OrderBy(node => node.OrderKey)
            .ThenBy(node => node.NodeId, StringComparer.Ordinal)
            .ToList();
        List<DiagramNode> packableNodes = nodes
            .Where(node => !DiagramSharedServiceCatalog.IsSharedService(node.ArmResourceType))
            .ToList();

        IReadOnlyDictionary<string, IReadOnlySet<string>> memberships =
            DiagramForestVnetMembership.Resolve(packableNodes, visibleEdges, sameResourceGroupOnly: false);
        Dictionary<string, DiagramNode> nodesById = packableNodes.ToDictionary(node => node.NodeId, StringComparer.Ordinal);
        Dictionary<string, string> nodeToVnet = memberships
            .SelectMany(pair => pair.Value.Append(pair.Key).Select(nodeId => (nodeId, pair.Key)))
            .GroupBy(pair => pair.nodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First().Item2, StringComparer.Ordinal);
        HashSet<string> assigned = [];
        List<NodePlacement> placements = [];
        List<VnetPrimaryGroup> vnetGroups = [];

        foreach ((string vnetNodeId, IReadOnlySet<string> memberIds) in memberships.OrderBy(pair => pair.Key, StringComparer.Ordinal))
        {
            if (!nodesById.TryGetValue(vnetNodeId, out DiagramNode? vnet))
            {
                continue;
            }

            List<DiagramNode> members = memberIds
                .Where(nodesById.ContainsKey)
                .Select(nodeId => nodesById[nodeId])
                .Where(node => !string.Equals(node.NodeId, vnetNodeId, StringComparison.Ordinal))
                .OrderBy(node => node.OrderKey)
                .ThenBy(node => node.NodeId, StringComparer.Ordinal)
                .ToList();
            if (members.Count == 0
                || (IsDataInventoryTitle(diagramTitle) && !members.Any(IsDataOrStorageNode)))
            {
                continue;
            }

            foreach (DiagramNode member in members.Where(member =>
                         !string.Equals(member.ArmResourceGroup, vnet.ArmResourceGroup, StringComparison.OrdinalIgnoreCase)))
            {
                member.IncludeResourceGroupInCaption = true;
            }

            List<NodePlacement> groupPlacements = LayoutNestedVnetMembers(
                members.Append(vnet).ToList(),
                visibleEdges,
                options,
                labelContext);
            double pad = DiagramForestResourceGroupFrameStyle.Pad;
            double labelBand = DiagramForestResourceGroupFrameStyle.LabelBand;
            double interiorWidth = groupPlacements.Count == 0
                ? options.UniformNodeWidth
                : groupPlacements.Max(placement => placement.X + placement.Width);
            double interiorHeight = groupPlacements.Count == 0
                ? options.NodeHeight
                : groupPlacements.Max(placement => placement.Y + placement.Height);
            double groupWidth = interiorWidth + (pad * 2.0d);
            double groupHeight = interiorHeight + labelBand + pad;
            string frameId = $"vnet-{vnetNodeId}";

            vnetGroups.Add(new VnetPrimaryGroup(
                vnetNodeId,
                vnet,
                members,
                groupPlacements
                    .Where(placement => !string.Equals(placement.Node.NodeId, vnetNodeId, StringComparison.Ordinal))
                    .Select(placement => placement with
                    {
                        X = placement.X + pad,
                        Y = placement.Y + labelBand,
                        VnetFrameId = frameId,
                    })
                    .Append(new NodePlacement(
                        vnet,
                        0.0d,
                        0.0d,
                        groupWidth,
                        groupHeight,
                        DiagramForestNodeMetricsCalculator.Measure(vnet, options, labelContext),
                        VnetFrameId: frameId,
                        IsFrameAnchor: true))
                    .ToList(),
                groupWidth,
                groupHeight));

            assigned.Add(vnetNodeId);
            assigned.UnionWith(members.Select(member => member.NodeId));
        }

        IReadOnlyList<DiagramNode> remainderNodes = packableNodes
            .Where(node => !assigned.Contains(node.NodeId))
            .ToList();
        List<VnetRemainderCell> remainderCells = [];
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell> cells =
            resourceGroupCells.Count > 0
                ? resourceGroupCells
                    .Select(cell => new DiagramResourceGroupPacker.ResourceGroupCell(
                        cell.GroupName,
                        cell.Nodes.Where(node => remainderNodes.Contains(node)).ToList()))
                    .Where(cell => cell.Nodes.Count > 0)
                    .ToList()
                : DiagramResourceGroupPacker.PartitionCells(remainderNodes);

        for (int cellIndex = 0; cellIndex < cells.Count; cellIndex++)
        {
            DiagramResourceGroupPacker.ResourceGroupCell cell = cells[cellIndex];
            List<NodePlacement> cellPlacements = LayoutResourceGroupCell(
                cell,
                $"vnet-remainder-{cellIndex}",
                0,
                visibleEdges,
                options,
                labelContext,
                diagramTitle);
            (double width, double height) = ResolveCellOuterSize(cellPlacements, options);
            Dictionary<string, int> connectionCounts = [];
            foreach (DiagramEdge edge in visibleEdges)
            {
                if (edge.IsLayoutOnly || DiagramForestEdgeLabelCollapse.IsPeeringEdge(edge))
                {
                    continue;
                }

                string? cellEndpoint = cell.Nodes.Any(node => node.NodeId == edge.FromNodeId)
                    ? edge.FromNodeId
                    : cell.Nodes.Any(node => node.NodeId == edge.ToNodeId)
                        ? edge.ToNodeId
                        : null;
                string? otherEndpoint = cellEndpoint == edge.FromNodeId ? edge.ToNodeId : edge.FromNodeId;
                if (cellEndpoint is null
                    || otherEndpoint is null
                    || !nodeToVnet.TryGetValue(otherEndpoint, out string? vnetNodeId)
                    || !vnetGroups.Any(group => group.NodeId == vnetNodeId))
                {
                    continue;
                }

                connectionCounts[vnetNodeId] = connectionCounts.TryGetValue(vnetNodeId, out int count)
                    ? count + 1
                    : 1;
            }

            remainderCells.Add(new VnetRemainderCell(cell, cellPlacements, width, height, connectionCounts));
        }

        double rowWidthLimit = ResolveRowWidthLimit(
            vnetGroups.Select(group => (group.Width, group.Height))
                .Concat(remainderCells.Select(cell => (cell.Width, cell.Height))),
            options);
        HashSet<VnetRemainderCell> placedCells = [];
        double groupX = 0.0d;
        double rowY = 0.0d;
        double rowHeight = 0.0d;
        HashSet<string> placedVnetGroups = [];
        for (int groupIndex = 0; groupIndex < vnetGroups.Count; groupIndex++)
        {
            VnetPrimaryGroup group = vnetGroups[groupIndex];
            if (placedVnetGroups.Contains(group.NodeId))
            {
                continue;
            }

            List<VnetRemainderCell> connectedCells = remainderCells
                .Where(cell => !placedCells.Contains(cell)
                    && ResolveSharedVnetPair(cell.VnetConnectionCounts) is null
                    && ResolveWinningVnet(cell.VnetConnectionCounts) == group.NodeId)
                .ToList();
            VnetRemainderCell? sharedCell = remainderCells
                .Where(cell => !placedCells.Contains(cell)
                    && ResolveSharedVnetPair(cell.VnetConnectionCounts) is { } pair
                    && pair.Left == group.NodeId)
                .FirstOrDefault();
            VnetPrimaryGroup? rightGroup = sharedCell is null
                ? null
                : vnetGroups.FirstOrDefault(candidate => candidate.NodeId
                    == ResolveSharedVnetPair(sharedCell.VnetConnectionCounts)!.Value.Right);

            if (sharedCell is not null && rightGroup is not null)
            {
                List<VnetRemainderCell> rightConnectedCells = remainderCells
                    .Where(cell => !placedCells.Contains(cell)
                        && ResolveWinningVnet(cell.VnetConnectionCounts) == rightGroup.NodeId)
                    .ToList();
                List<(IReadOnlyList<NodePlacement> Items, double Width, double Height)> block =
                [
                    .. connectedCells.Select(cell => (cell.Placements, cell.Width, cell.Height)),
                    (group.Placements, group.Width, group.Height),
                    (sharedCell.Placements, sharedCell.Width, sharedCell.Height),
                    (rightGroup.Placements, rightGroup.Width, rightGroup.Height),
                    .. rightConnectedCells.Select(cell => (cell.Placements, cell.Width, cell.Height)),
                ];
                PlaceVnetPrimaryBlock(block, rowWidthLimit, options, placements, ref groupX, ref rowY, ref rowHeight);
                placedCells.UnionWith(connectedCells);
                placedCells.Add(sharedCell);
                placedCells.UnionWith(rightConnectedCells);
                placedVnetGroups.Add(group.NodeId);
                placedVnetGroups.Add(rightGroup.NodeId);
                continue;
            }

            List<(IReadOnlyList<NodePlacement> Items, double Width, double Height)> neighborhood =
            [
                (group.Placements, group.Width, group.Height),
                .. connectedCells.Select(cell => (cell.Placements, cell.Width, cell.Height)),
            ];
            PlaceVnetPrimaryNeighborhood(
                neighborhood,
                rowWidthLimit,
                options,
                placements,
                ref groupX,
                ref rowY,
                ref rowHeight);
            placedCells.UnionWith(connectedCells);
            placedVnetGroups.Add(group.NodeId);
        }

        List<VnetRemainderCell> unplacedCells = remainderCells
            .Where(cell => !placedCells.Contains(cell))
            .ToList();
        if (unplacedCells.Count > 0)
        {
            PlaceVnetPrimaryBlock(
                unplacedCells.Select(cell => (cell.Placements, cell.Width, cell.Height)).ToList(),
                rowWidthLimit,
                options,
                placements,
                ref groupX,
                ref rowY,
                ref rowHeight,
                wrapItems: true);
        }

        if (sharedServiceNodes.Count > 0)
        {
            List<NodePlacement> sharedPlacements = LayoutSharedServicesCell(
                sharedServiceNodes,
                visibleEdges,
                options,
                labelContext);
            (double width, double height) = ResolveCellOuterSize(sharedPlacements, options);
            PlaceVnetPrimaryBlock(
                [(sharedPlacements, width, height)],
                ResolveRowWidthLimit([(width, height)], options),
                options,
                placements,
                ref groupX,
                ref rowY,
                ref rowHeight,
                wrapItems: true);
        }

        return placements;
    }

    private static List<NodePlacement> LayoutSharedServicesCell(
        IReadOnlyList<DiagramNode> nodes,
        IReadOnlyList<DiagramEdge> visibleEdges,
        DiagramForestLayoutOptions options,
        DiagramForestCanvasLabelContext labelContext)
    {
        List<NodePlacement> interiorPlacements = LayoutCellInterior(nodes, visibleEdges, options, labelContext);
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
                FrameCellId = SharedServicesFrameCellId,
            })
            .ToList();
    }

    internal static double ResolveRowWidthLimit(
        IEnumerable<(double Width, double Height)> cells,
        DiagramForestLayoutOptions options)
    {
        double area = cells.Sum(cell =>
            (cell.Width + options.ComponentHorizontalGap)
            * (cell.Height + options.ComponentVerticalGap));
        double aspectWidth = Math.Sqrt(Math.Max(0.0d, area * options.PlateTargetAspect));
        return Math.Max(options.MaxNodeWidth * 3, aspectWidth);
    }

    private static void PlaceVnetPrimaryNeighborhood(
        IReadOnlyList<(IReadOnlyList<NodePlacement> Items, double Width, double Height)> neighborhood,
        double rowWidthLimit,
        DiagramForestLayoutOptions options,
        List<NodePlacement> placements,
        ref double groupX,
        ref double rowY,
        ref double rowHeight)
    {
        double neighborhoodWidth = neighborhood.Sum(item => item.Width)
            + Math.Max(0, neighborhood.Count - 1) * options.ComponentHorizontalGap;

        if (groupX > 0.0d && groupX + neighborhoodWidth > rowWidthLimit)
        {
            groupX = 0.0d;
            rowY += rowHeight + options.ComponentVerticalGap;
            rowHeight = 0.0d;
        }

        double neighborhoodX = groupX;
        double neighborhoodRowY = rowY;
        double neighborhoodRowHeight = 0.0d;
        double localX = neighborhoodX;
        bool wrapped = false;

        foreach ((IReadOnlyList<NodePlacement> items, double width, double height) in neighborhood)
        {
            double relativeRight = (localX - neighborhoodX) + width;
            if (localX > neighborhoodX && relativeRight > rowWidthLimit)
            {
                localX = neighborhoodX;
                neighborhoodRowY += neighborhoodRowHeight + options.ComponentVerticalGap;
                neighborhoodRowHeight = 0.0d;
                wrapped = true;
            }

            foreach (NodePlacement item in items)
            {
                placements.Add(item with
                {
                    X = item.X + localX,
                    Y = item.Y + neighborhoodRowY,
                });
            }

            localX += width + options.ComponentHorizontalGap;
            neighborhoodRowHeight = Math.Max(neighborhoodRowHeight, height);
        }

        if (wrapped)
        {
            groupX = 0.0d;
            rowY = neighborhoodRowY + neighborhoodRowHeight + options.ComponentVerticalGap;
            rowHeight = 0.0d;
        }
        else
        {
            groupX = localX;
            rowHeight = Math.Max(rowHeight, neighborhoodRowHeight);
        }
    }

    private static string? ResolveWinningVnet(IReadOnlyDictionary<string, int> counts)
    {
        return counts
            .OrderByDescending(pair => pair.Value)
            .ThenBy(pair => pair.Key, StringComparer.Ordinal)
            .Select(pair => pair.Key)
            .FirstOrDefault();
    }

    private static (string Left, string Right)? ResolveSharedVnetPair(IReadOnlyDictionary<string, int> counts)
    {
        if (counts.Count != 2)
        {
            return null;
        }

        int highest = counts.Values.Max();
        if (counts.Values.Any(value => value != highest))
        {
            return null;
        }

        string[] ids = counts.Keys.OrderBy(id => id, StringComparer.Ordinal).ToArray();
        return (ids[0], ids[1]);
    }

    private static void PlaceVnetPrimaryBlock(
        IReadOnlyList<(IReadOnlyList<NodePlacement> Items, double Width, double Height)> block,
        double rowWidthLimit,
        DiagramForestLayoutOptions options,
        List<NodePlacement> placements,
        ref double groupX,
        ref double rowY,
        ref double rowHeight,
        bool wrapItems = false)
    {
        if (wrapItems)
        {
            foreach ((IReadOnlyList<NodePlacement> items, double width, double height) in block)
            {
                if (groupX > 0.0d && groupX + width > rowWidthLimit)
                {
                    groupX = 0.0d;
                    rowY += rowHeight + options.ComponentVerticalGap;
                    rowHeight = 0.0d;
                }

                foreach (NodePlacement item in items)
                {
                    placements.Add(item with
                    {
                        X = item.X + groupX,
                        Y = item.Y + rowY,
                    });
                }

                groupX += width + options.ComponentHorizontalGap;
                rowHeight = Math.Max(rowHeight, height);
            }

            return;
        }

        double blockWidth = block.Sum(item => item.Width)
            + Math.Max(0, block.Count - 1) * options.ComponentHorizontalGap;
        if (groupX > 0.0d && groupX + blockWidth > rowWidthLimit)
        {
            groupX = 0.0d;
            rowY += rowHeight + options.ComponentVerticalGap;
            rowHeight = 0.0d;
        }

        foreach ((IReadOnlyList<NodePlacement> items, double width, double height) in block)
        {
            foreach (NodePlacement item in items)
            {
                placements.Add(item with
                {
                    X = item.X + groupX,
                    Y = item.Y + rowY,
                });
            }

            groupX += width + options.ComponentHorizontalGap;
            rowHeight = Math.Max(rowHeight, height);
        }
    }

    private static bool IsInVerb(string? label)
    {
        if (string.IsNullOrWhiteSpace(label))
        {
            return false;
        }

        string trimmed = label.Trim();
        return trimmed.Equals("in", StringComparison.OrdinalIgnoreCase)
            || trimmed.EndsWith("· in", StringComparison.OrdinalIgnoreCase);
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
        DiagramForestCanvasLabelContext labelContext,
        string diagramTitle)
    {
        ArgumentNullException.ThrowIfNull(cells);

        IReadOnlyList<IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell>> layers =
            DiagramResourceGroupCellFlowPlanner.GroupByLayers(cells, visibleEdges);

        if (layers.Count > 1)
        {
            return BuildLayeredResourceGroupCellLayouts(layers, visibleEdges, options, labelContext, diagramTitle);
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
                labelContext,
                diagramTitle));
        }

        return layouts;
    }

    private static List<ComponentLayout> BuildLayeredResourceGroupCellLayouts(
        IReadOnlyList<IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupCell>> layers,
        IReadOnlyList<DiagramEdge> visibleEdges,
        DiagramForestLayoutOptions options,
        DiagramForestCanvasLabelContext labelContext,
        string diagramTitle)
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
                    labelContext,
                    diagramTitle));
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
        DiagramForestCanvasLabelContext labelContext,
        string diagramTitle)
    {
        string componentKey = $"{rowIndex}_{columnIndex}";
        List<NodePlacement> relativePlacements = LayoutResourceGroupCell(
            cell,
            componentKey,
            cellIndex: 0,
            visibleEdges,
            options,
            labelContext,
            diagramTitle);
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
        List<(List<NodePlacement> Placements, double Width, double Height)> layouts = [];
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
            layouts.Add((islandPlacements, islandWidth, islandHeight));
        }

        double rowWidthLimit = ResolveRowWidthLimit(
            layouts.Select(layout => (layout.Width, layout.Height)),
            options);
        double islandX = 0.0d;
        double rowY = 0.0d;
        double rowHeight = 0.0d;

        foreach ((List<NodePlacement> islandPlacements, double islandWidth, double islandHeight) in layouts)
        {
            if (islandX > 0.0d && islandX + islandWidth > rowWidthLimit)
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
        DiagramForestCanvasLabelContext labelContext,
        string diagramTitle)
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
        List<NodePlacement> interiorPlacements = LayoutVnetAwareCell(
            cell.Nodes,
            orderedIslands,
            visibleEdges,
            options,
            labelContext,
            diagramTitle);

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

    private static List<NodePlacement> LayoutVnetAwareCell(
        IReadOnlyList<DiagramNode> cellNodes,
        IReadOnlyList<IReadOnlyList<DiagramNode>> orderedIslands,
        IReadOnlyList<DiagramEdge> visibleEdges,
        DiagramForestLayoutOptions options,
        DiagramForestCanvasLabelContext labelContext,
        string diagramTitle)
    {
        if (diagramTitle.Contains("(Identity)", StringComparison.OrdinalIgnoreCase))
        {
            return orderedIslands.Count <= 1
                ? LayoutCellInterior(cellNodes, visibleEdges, options, labelContext)
                : PackIslandPlacements(orderedIslands, visibleEdges, options, labelContext);
        }

        IReadOnlyDictionary<string, IReadOnlySet<string>> memberships =
            DiagramForestVnetMembership.Resolve(cellNodes, visibleEdges, sameResourceGroupOnly: true);
        Dictionary<string, DiagramNode> nodesById = cellNodes.ToDictionary(
            node => node.NodeId,
            StringComparer.Ordinal);
        HashSet<string> assigned = [];
        List<(string? FrameId, DiagramNode? Vnet, IReadOnlyList<DiagramNode> Nodes)> groups = [];

        foreach ((string vnetNodeId, IReadOnlySet<string> memberIds) in memberships)
        {
            if (!nodesById.TryGetValue(vnetNodeId, out DiagramNode? vnet))
            {
                continue;
            }

            List<DiagramNode> members = memberIds
                .Where(nodesById.ContainsKey)
                .Select(nodeId => nodesById[nodeId])
                .Where(node => !string.Equals(node.NodeId, vnetNodeId, StringComparison.Ordinal))
                .OrderBy(node => node.OrderKey)
                .ThenBy(node => node.NodeId, StringComparer.Ordinal)
                .ToList();
            if (members.Count == 0
                || (IsDataInventoryTitle(diagramTitle) && !members.Any(IsDataOrStorageNode)))
            {
                continue;
            }

            groups.Add(($"vnet-{vnetNodeId}", vnet, members));
            assigned.Add(vnetNodeId);
            assigned.UnionWith(members.Select(node => node.NodeId));
        }

        if (groups.Count == 0)
        {
            return orderedIslands.Count <= 1
                ? LayoutCellInterior(cellNodes, visibleEdges, options, labelContext)
                : PackIslandPlacements(orderedIslands, visibleEdges, options, labelContext);
        }

        List<DiagramNode> remainder = cellNodes
            .Where(node => !assigned.Contains(node.NodeId))
            .ToList();
        if (remainder.Count > 0)
        {
            groups.Add((null, null, remainder));
        }

        List<(string? FrameId, DiagramNode? Vnet, List<NodePlacement> Placements, double Width, double Height, double OffsetX, double OffsetY)> layouts = [];
        foreach ((string? frameId, DiagramNode? vnet, IReadOnlyList<DiagramNode> groupNodes) in groups)
        {
            List<NodePlacement> groupPlacements = LayoutNestedVnetMembers(
                groupNodes,
                visibleEdges,
                options,
                labelContext);
            bool framed = frameId is not null && vnet is not null;
            double pad = DiagramForestResourceGroupFrameStyle.Pad;
            double labelBand = DiagramForestResourceGroupFrameStyle.LabelBand;
            double offsetX = framed ? pad : 0.0d;
            double offsetY = framed ? labelBand : 0.0d;
            double interiorWidth = groupPlacements.Count == 0
                ? options.UniformNodeWidth
                : groupPlacements.Max(placement => placement.X + placement.Width);
            double interiorHeight = groupPlacements.Count == 0
                ? options.NodeHeight
                : groupPlacements.Max(placement => placement.Y + placement.Height);
            double groupWidth = framed ? interiorWidth + (pad * 2.0d) : interiorWidth;
            double groupHeight = framed ? interiorHeight + labelBand + pad : interiorHeight;
            layouts.Add((
                frameId,
                vnet,
                groupPlacements,
                groupWidth,
                groupHeight,
                framed ? pad : 0.0d,
                framed ? labelBand : 0.0d));
        }

        double rowWidthLimit = ResolveRowWidthLimit(
            layouts.Select(layout => (layout.Width, layout.Height)),
            options);
        List<NodePlacement> placements = [];
        double groupX = 0.0d;
        double rowY = 0.0d;
        double rowHeight = 0.0d;

        foreach ((string? frameId, DiagramNode? vnet, List<NodePlacement> groupPlacements, double groupWidth, double groupHeight, double offsetX, double offsetY) in layouts)
        {
            if (groupX > 0.0d && groupX + groupWidth > rowWidthLimit)
            {
                groupX = 0.0d;
                rowY += rowHeight + options.ComponentVerticalGap;
                rowHeight = 0.0d;
            }

            placements.AddRange(groupPlacements.Select(placement => placement with
            {
                X = placement.X + groupX + offsetX,
                Y = placement.Y + rowY + offsetY,
                VnetFrameId = frameId,
            }));

            if (frameId is not null && vnet is not null)
            {
                placements.Add(new NodePlacement(
                    vnet!,
                    groupX,
                    rowY,
                    groupWidth,
                    groupHeight,
                    DiagramForestNodeMetricsCalculator.Measure(vnet!, options, labelContext),
                    VnetFrameId: frameId,
                    IsFrameAnchor: true));
            }

            groupX += groupWidth + options.ComponentHorizontalGap;
            rowHeight = Math.Max(rowHeight, groupHeight);
        }

        return placements;
    }

    private static List<NodePlacement> LayoutNestedVnetMembers(
        IReadOnlyList<DiagramNode> vnetMembers,
        IReadOnlyList<DiagramEdge> visibleEdges,
        DiagramForestLayoutOptions options,
        DiagramForestCanvasLabelContext labelContext)
    {
        List<DiagramNode> subnets = vnetMembers
            .Where(IsSubnetNode)
            .OrderBy(node => node.OrderKey)
            .ThenBy(node => node.NodeId, StringComparer.Ordinal)
            .ToList();
        if (subnets.Count == 0)
        {
            return LayoutCellInterior(vnetMembers, visibleEdges, options, labelContext);
        }

        HashSet<string> assigned = [];
        List<IReadOnlyList<DiagramNode>> groups = [];

        foreach (DiagramNode subnet in subnets)
        {
            List<DiagramNode> members = vnetMembers
                .Where(node => string.Equals(node.NodeId, subnet.NodeId, StringComparison.Ordinal)
                               || visibleEdges.Any(edge =>
                                   string.Equals(edge.ToNodeId, subnet.NodeId, StringComparison.Ordinal)
                                   && string.Equals(edge.FromNodeId, node.NodeId, StringComparison.Ordinal)
                                   && DiagramForestVnetMembership.IsCitedPlacementEdge(edge)))
                .OrderBy(node => node.OrderKey)
                .ThenBy(node => node.NodeId, StringComparer.Ordinal)
                .ToList();

            if (members.Count == 1)
            {
                continue;
            }

            groups.Add(members);
            assigned.UnionWith(members.Select(node => node.NodeId));
        }

        List<DiagramNode> remainder = vnetMembers
            .Where(node => !assigned.Contains(node.NodeId))
            .ToList();
        if (remainder.Count > 0)
        {
            groups.Add(remainder);
        }

        if (groups.Count <= 1)
        {
            return LayoutCellInterior(vnetMembers, visibleEdges, options, labelContext);
        }

        List<(List<NodePlacement> Placements, double Width, double Height)> layouts = [];
        foreach (IReadOnlyList<DiagramNode> group in groups)
        {
            List<NodePlacement> groupPlacements = LayoutCellInterior(
                group,
                visibleEdges,
                options,
                labelContext);
            (double groupWidth, double groupHeight) = ResolveCellOuterSize(groupPlacements, options);
            layouts.Add((groupPlacements, groupWidth, groupHeight));
        }

        double rowWidthLimit = ResolveRowWidthLimit(
            layouts.Select(layout => (layout.Width, layout.Height)),
            options);
        List<NodePlacement> placements = [];
        double groupX = 0.0d;
        double rowY = 0.0d;
        double rowHeight = 0.0d;

        foreach ((List<NodePlacement> groupPlacements, double groupWidth, double groupHeight) in layouts)
        {
            if (groupX > 0.0d && groupX + groupWidth > rowWidthLimit)
            {
                groupX = 0.0d;
                rowY += rowHeight + options.ComponentVerticalGap;
                rowHeight = 0.0d;
            }

            placements.AddRange(groupPlacements.Select(placement => placement with
            {
                X = placement.X + groupX,
                Y = placement.Y + rowY,
            }));

            groupX += groupWidth + options.ComponentHorizontalGap;
            rowHeight = Math.Max(rowHeight, groupHeight);
        }

        return placements;
    }

    private static bool IsSubnetNode(DiagramNode node)
    {
        return (node.ArmResourceType ?? string.Empty).Contains(
            "Microsoft.Network/virtualNetworks/subnets",
            StringComparison.OrdinalIgnoreCase);
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
                placement.FrameCellId,
                placement.VnetFrameId,
                placement.IsFrameAnchor))
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
        foreach (DiagramEdge edge in ResolveVnetInternalPlacementEdges(renderableNodes, visibleEdges))
        {
            suppressedEdgeKeys.Add(DiagramForestEdgeLabelCollapse.EdgeKey(edge));
        }
        (IReadOnlyList<DiagramEdge> bundledEdges,
            IReadOnlySet<string> bundledOriginalKeys,
            IReadOnlyDictionary<string, FrameEdgeRoute> bundledRoutes,
            IReadOnlyDictionary<string, BundleEndpointIds> bundledEndpointIds) =
            ResolvePrivateEndpointBundles(
                visibleEdges,
                placements,
                frameBounds,
                nestedFrameBounds,
                title);
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

        bool vnetPrimary = IsVnetPrimaryTitle(title);
        NeighborhoodMap neighborhoodMap = vnetPrimary
            ? ResolveNeighborhoodMetadata(placements, frameBounds, nestedFrameBounds, visibleEdges)
            : new NeighborhoodMap([], []);
        if (neighborhoodMap.Neighborhoods.Count > 0)
        {
            root.AddFirst(EmitNeighborhoodMetadata(svgNamespace, neighborhoodMap));
        }

        DiagramForestEdgeArrowMarkerSvgEmitter.EmitDefs(svgNamespace, root);

        if (frameBounds.Count > 0)
        {
            XElement frameLayer = DiagramForestResourceGroupFrameSvgEmitter.EmitLayer(
                svgNamespace,
                frameBounds,
                vnetPrimary);
            ApplyNeighborhoodFrameAttributes(frameLayer, neighborhoodMap.Neighborhoods);
            root.Add(frameLayer);
        }

        if (subscriptionFrame is not null || nestedFrameBounds.Count > 0)
        {
            List<DiagramForestNestedFrameBounds> containerFrames = [];

            if (subscriptionFrame is not null)
            {
                containerFrames.Add(subscriptionFrame);
            }

            containerFrames.AddRange(nestedFrameBounds);
            XElement frameLayer = DiagramForestNestedFrameSvgEmitter.EmitLayer(
                svgNamespace,
                containerFrames,
                vnetPrimary);
            ApplyNeighborhoodFrameAttributes(frameLayer, neighborhoodMap.Neighborhoods);
            root.Add(frameLayer);
        }

        if (isDataFlow && dataFlowColumns is not null && dataFlowColumns.Count > 0)
        {
            root.Add(DiagramForestDataFlowStageLabelSvgEmitter.EmitLayer(
                svgNamespace,
                dataFlowColumns,
                placements
                    .Select(placement => new DiagramForestDataFlowColumnLayout.NodePlacement(
                        placement.Node,
                        placement.X,
                        placement.Y,
                        placement.Width,
                        placement.Height,
                        placement.Metrics,
                        placement.DataFlowColumnIndex))
                    .ToList(),
                visibleEdges,
                options));
        }

        XElement edgeLayer = new(svgNamespace + "g", new XAttribute("class", "edges"));
        List<(double X, double Y, double Width, double Height)> placedLabelBounds = [];
        List<IReadOnlyList<(double X1, double Y1, double X2, double Y2)>> alreadyRouted = [];
        IReadOnlyList<DiagramForestLongEdgeStub.RowBand> rowBands = DiagramForestLongEdgeStub.BuildRowBands(
            frameBounds
                .Select(frame => (frame.Y, frame.Height))
                .Concat(nestedFrameBounds
                    .Where(frame => string.Equals(frame.Kind, "vnet", StringComparison.Ordinal))
                    .Select(frame => (frame.Y, frame.Height))));

        foreach (DiagramEdge edge in visibleEdges.Concat(bundledEdges))
        {
            string edgeKey = DiagramForestEdgeLabelCollapse.EdgeKey(edge);
            if ((!bundledEdges.Contains(edge) && bundledOriginalKeys.Contains(edgeKey))
                || IsInteriorVnetPlacementEdge(edge, placements))
            {
                continue;
            }

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
                    throw new InvalidOperationException(
                        $"Data-flow edge could not be routed between placed nodes '{routeFromNodeId}' and '{routeToNodeId}'.");
                }
            }
            else if (bundledRoutes.TryGetValue(
                         DiagramForestEdgeLabelCollapse.EdgeKey(edge),
                         out FrameEdgeRoute? bundledRoute))
            {
                route = DiagramForestOrthogonalEdgeRouter.Route(
                    bundledRoute.FromX,
                    bundledRoute.FromY,
                    bundledRoute.ToX,
                    bundledRoute.ToY,
                    [],
                    alreadyRouted);
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

            if (route.Segments.Count > 0
                && DiagramForestLongEdgeStub.ShouldStub(route.Segments[0].Y1, route.Segments[^1].Y2, rowBands))
            {
                alreadyRouted.Add(DiagramForestLongEdgeStub.BuildStubSegments(route.Segments, options.NodeHorizontalGap));
                foreach (XElement stub in DiagramForestLongEdgeStub.Emit(
                    svgNamespace,
                    edge,
                    route.Segments,
                    fromPlacement.Node.Label,
                    toPlacement.Node.Label,
                    routeFromNodeId,
                    routeToNodeId,
                    options.NodeHorizontalGap))
                {
                    edgeLayer.Add(stub);
                }

                continue;
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
                placedLabelBounds,
                bundledEndpointIds.TryGetValue(
                    DiagramForestEdgeLabelCollapse.EdgeKey(edge),
                    out BundleEndpointIds? endpointIds)
                    ? endpointIds.FromNodeIds
                    : null,
                endpointIds?.ToNodeIds));
        }

        root.Add(edgeLayer);

        foreach (NodePlacement placement in placements.OrderBy(candidate => candidate.Node.OrderKey)
                     .ThenBy(candidate => candidate.Node.NodeId, StringComparer.Ordinal))
        {
            if (placement.IsFrameAnchor)
            {
                continue;
            }

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

    private static NeighborhoodMap ResolveNeighborhoodMetadata(
        IReadOnlyList<NodePlacement> placements,
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupFrameBounds> resourceGroupFrames,
        IReadOnlyList<DiagramForestNestedFrameBounds> nestedFrames,
        IReadOnlyList<DiagramEdge> visibleEdges)
    {
        Dictionary<string, NodePlacement> placementsById = placements
            .Where(placement => !placement.IsFrameAnchor)
            .ToDictionary(placement => placement.Node.NodeId, StringComparer.Ordinal);
        Dictionary<string, List<NodePlacement>> placementsByResourceFrame = placements
            .Where(placement => !placement.IsFrameAnchor && placement.FrameCellId is not null)
            .GroupBy(placement => placement.FrameCellId!, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.ToList(), StringComparer.Ordinal);
        Dictionary<string, string> vnetNodeByFrameId = nestedFrames
            .Where(frame => string.Equals(frame.Kind, "vnet", StringComparison.Ordinal))
            .ToDictionary(
                frame => frame.FrameId,
                frame => frame.FrameId.StartsWith("vnet-", StringComparison.Ordinal)
                    ? frame.FrameId["vnet-".Length..]
                    : frame.FrameId,
                StringComparer.Ordinal);
        List<NeighborhoodMetadata> neighborhoods = [];
        Dictionary<string, NeighborhoodMetadata> byId = new(StringComparer.Ordinal);

        foreach ((string frameId, string vnetNodeId) in vnetNodeByFrameId)
        {
            List<NodePlacement> members = placements
                .Where(placement => !placement.IsFrameAnchor
                    && string.Equals(placement.VnetFrameId, frameId, StringComparison.Ordinal)
                    && !string.Equals(placement.Node.NodeId, vnetNodeId, StringComparison.Ordinal))
                .ToList();
            NeighborhoodMetadata neighborhood = CreateNeighborhood(
                $"vnet:{vnetNodeId}",
                "vnet",
                nestedFrames.First(frame => frame.FrameId == frameId).Label,
                members,
                [frameId]);
            neighborhoods.Add(neighborhood);
            byId[neighborhood.Id] = neighborhood;
        }

        List<(string FrameId, List<NodePlacement> Members)> remainder = [];
        foreach (DiagramResourceGroupPacker.ResourceGroupFrameBounds frame in resourceGroupFrames)
        {
            remainder.Add((
                frame.FrameCellId,
                placementsByResourceFrame.TryGetValue(frame.FrameCellId, out List<NodePlacement>? members)
                    ? members
                    : []));
        }

        foreach ((string frameId, List<NodePlacement> members) in remainder)
        {
            List<string> targetVnets = visibleEdges
                .Select(edge => ResolveOtherEndpointForFrame(edge, members))
                .Where(endpoint => endpoint is not null)
                .Select(endpoint => endpoint!)
                .Where(vnetNodeByFrameId.ContainsValue)
                .Select(endpoint => vnetNodeByFrameId.First(pair => pair.Value == endpoint).Key)
                .Distinct(StringComparer.Ordinal)
                .ToList();

            if (targetVnets.Count == 1 && byId.TryGetValue($"vnet:{vnetNodeByFrameId[targetVnets[0]]}", out NeighborhoodMetadata? vnet))
            {
                List<NodePlacement> mergeMembers = members
                    .Where(placement =>
                        !DiagramSharedServiceCatalog.IsSharedService(placement.Node.ArmResourceType))
                    .ToList();

                if (mergeMembers.Count == 0)
                {
                    continue;
                }

                byId[vnet.Id] = vnet with
                {
                    Members = vnet.Members.Concat(mergeMembers).ToList(),
                    FrameIds = vnet.FrameIds.Concat([frameId]).ToList(),
                };
                neighborhoods[neighborhoods.FindIndex(candidate => candidate.Id == vnet.Id)] = byId[vnet.Id];
                continue;
            }

            bool isRollup = members.Count == 1
                && string.Equals(
                    members[0].Node.NodeId,
                    "other-resource-groups-rollup",
                    StringComparison.Ordinal);
            string kind = isRollup ? "other" : targetVnets.Count > 1 ? "shared" : "remainder";
            string id = isRollup ? "other-resource-groups" : $"{kind}:{frameId}";
            NeighborhoodMetadata cell = CreateNeighborhood(
                id,
                kind,
                isRollup
                    ? members[0].Node.Label
                    : members.FirstOrDefault()?.Node.ArmResourceGroup ?? frameId,
                members,
                [frameId]);
            neighborhoods.Add(cell);
            byId[id] = cell;
        }

        List<NeighborhoodMetadata> singletons = neighborhoods
            .Where(neighborhood => neighborhood.Kind == "remainder"
                && neighborhood.Members.Count == 1
                && !string.Equals(
                    neighborhood.Members[0].Node.NodeId,
                    "other-resource-groups-rollup",
                    StringComparison.Ordinal))
            .ToList();
        if (singletons.Count >= 2)
        {
            foreach (NeighborhoodMetadata singleton in singletons)
            {
                neighborhoods.Remove(singleton);
                byId.Remove(singleton.Id);
            }

            NeighborhoodMetadata other = CreateNeighborhood(
                "other-resource-groups",
                "other",
                $"Other resource groups ({singletons.Count})",
                singletons.SelectMany(singleton => singleton.Members).ToList(),
                singletons.SelectMany(singleton => singleton.FrameIds).ToList());
            neighborhoods.Add(other);
            byId[other.Id] = other;
        }

        List<NodePlacement> sharedServiceMembers = placements
            .Where(placement => !placement.IsFrameAnchor
                && string.Equals(placement.FrameCellId, SharedServicesFrameCellId, StringComparison.Ordinal))
            .ToList();
        if (sharedServiceMembers.Count > 0)
        {
            NeighborhoodMetadata sharedServices = CreateNeighborhood(
                SharedServicesFrameCellId,
                "shared-services",
                SharedServicesFrameTitle,
                sharedServiceMembers,
                [SharedServicesFrameCellId]);
            neighborhoods.Add(sharedServices);
            byId[sharedServices.Id] = sharedServices;
        }

        List<NeighborhoodLink> links = [];
        foreach (DiagramEdge edge in visibleEdges)
        {
            if (edge.IsLayoutOnly
                || string.Equals(
                    edge.InferenceSource,
                    GraphEdgeInferenceSources.InventoryResourceGroupCollocation,
                    StringComparison.OrdinalIgnoreCase)
                || !placementsById.ContainsKey(edge.FromNodeId)
                || !placementsById.ContainsKey(edge.ToNodeId))
            {
                continue;
            }

            string? from = ResolveNeighborhoodForNode(neighborhoods, edge.FromNodeId);
            string? to = ResolveNeighborhoodForNode(neighborhoods, edge.ToNodeId);
            if (from is null || to is null || string.Equals(from, to, StringComparison.Ordinal))
            {
                continue;
            }

            (string left, string right) = string.CompareOrdinal(from, to) < 0 ? (from, to) : (to, from);
            int linkIndex = links.FindIndex(link => link.From == left && link.To == right);
            if (linkIndex >= 0)
            {
                links[linkIndex] = links[linkIndex] with { Count = links[linkIndex].Count + 1 };
            }
            else
            {
                links.Add(new NeighborhoodLink(left, right, 1));
            }
        }

        return new NeighborhoodMap(
            neighborhoods
                .OrderBy(neighborhood => neighborhood.Kind switch
                {
                    "vnet" => 0,
                    "shared" => 1,
                    "remainder" => 2,
                    "other" => 3,
                    "shared-services" => 4,
                    _ => 5,
                })
                .ThenBy(neighborhood => neighborhood.Id, StringComparer.Ordinal)
                .ToList(),
            links
                .OrderBy(link => link.From, StringComparer.Ordinal)
                .ThenBy(link => link.To, StringComparer.Ordinal)
                .ToList());
    }

    private static string? ResolveNeighborhoodForNode(
        IReadOnlyList<NeighborhoodMetadata> neighborhoods,
        string nodeId)
    {
        NeighborhoodMetadata? memberNeighborhood = neighborhoods.FirstOrDefault(candidate =>
            candidate.Members.Any(member => member.Node.NodeId == nodeId));
        if (memberNeighborhood is not null)
        {
            return memberNeighborhood.Id;
        }

        return neighborhoods
            .Where(candidate => candidate.Kind == "vnet")
            .FirstOrDefault(candidate =>
            {
                string vnetNodeId = candidate.Id.StartsWith("vnet:", StringComparison.Ordinal)
                    ? candidate.Id["vnet:".Length..]
                    : string.Empty;
                return string.Equals(vnetNodeId, nodeId, StringComparison.Ordinal);
            })
            ?.Id;
    }

    private static string? ResolveOtherEndpointForFrame(
        DiagramEdge edge,
        IReadOnlyList<NodePlacement> frameMembers)
    {
        bool fromInFrame = frameMembers.Any(member => member.Node.NodeId == edge.FromNodeId);
        bool toInFrame = frameMembers.Any(member => member.Node.NodeId == edge.ToNodeId);
        if (fromInFrame == toInFrame)
        {
            return null;
        }

        return fromInFrame ? edge.ToNodeId : edge.FromNodeId;
    }

    private static NeighborhoodMetadata CreateNeighborhood(
        string id,
        string kind,
        string title,
        IReadOnlyList<NodePlacement> members,
        IReadOnlyList<string> frameIds)
    {
        IReadOnlyList<(string Name, int Count)> types = members
            .Select(member => member.Node.ArmResourceType?.Split('/', StringSplitOptions.RemoveEmptyEntries).LastOrDefault())
            .Where(type => !string.IsNullOrWhiteSpace(type))
            .GroupBy(type => type!, StringComparer.Ordinal)
            .OrderByDescending(group => group.Count())
            .ThenBy(group => group.Key, StringComparer.Ordinal)
            .Take(4)
            .Select(group => (group.Key, group.Count()))
            .ToList();
        return new NeighborhoodMetadata(id, kind, title, members, frameIds, types);
    }

    private static XElement EmitNeighborhoodMetadata(
        XNamespace svgNamespace,
        NeighborhoodMap map)
    {
        XElement metadata = new(
            svgNamespace + "metadata",
            new XAttribute("id", "diagram-neighborhoods"));

        foreach (NeighborhoodMetadata neighborhood in map.Neighborhoods)
        {
            XElement element = new(
                svgNamespace + "neighborhood",
                new XAttribute("id", neighborhood.Id),
                new XAttribute("kind", neighborhood.Kind),
                new XAttribute("title", neighborhood.Title),
                new XAttribute("resource-count", neighborhood.Members.Count));
            foreach (NodePlacement member in neighborhood.Members)
            {
                element.Add(new XElement(
                    svgNamespace + "member",
                    new XAttribute("id", MermaidIdSanitizer.Sanitize(member.Node.NodeId))));
            }

            foreach (string frameId in neighborhood.FrameIds)
            {
                element.Add(new XElement(svgNamespace + "frame", new XAttribute("id", frameId)));
            }

            foreach ((string name, int count) in neighborhood.Types)
            {
                element.Add(new XElement(
                    svgNamespace + "type",
                    new XAttribute("name", name),
                    new XAttribute("count", count)));
            }

            metadata.Add(element);
        }

        foreach (NeighborhoodLink link in map.Links)
        {
            metadata.Add(new XElement(
                svgNamespace + "link",
                new XAttribute("from", link.From),
                new XAttribute("to", link.To),
                new XAttribute("count", link.Count)));
        }

        return metadata;
    }

    private static void ApplyNeighborhoodFrameAttributes(
        XElement frameLayer,
        IReadOnlyList<NeighborhoodMetadata> neighborhoods)
    {
        Dictionary<string, string> frameToNeighborhood = new(StringComparer.Ordinal);

        foreach (NeighborhoodMetadata neighborhood in neighborhoods)
        {
            foreach (string frameId in neighborhood.FrameIds)
            {
                frameToNeighborhood.TryAdd(frameId, neighborhood.Id);
            }
        }
        foreach (XElement frame in frameLayer.Elements())
        {
            string frameId = frame.Attribute("data-frame-id")?.Value
                ?? frame.Attribute("data-frame-cell-id")?.Value
                ?? string.Empty;
            if (frameToNeighborhood.TryGetValue(frameId, out string? neighborhoodId))
            {
                frame.Add(new XAttribute("data-neighborhood-id", neighborhoodId));
            }
        }
    }

    private static (
        IReadOnlyList<DiagramEdge> BundledEdges,
        IReadOnlySet<string> BundledOriginalKeys,
        IReadOnlyDictionary<string, FrameEdgeRoute> BundledRoutes,
        IReadOnlyDictionary<string, BundleEndpointIds> BundledEndpointIds) ResolvePrivateEndpointBundles(
        IReadOnlyList<DiagramEdge> visibleEdges,
        IReadOnlyList<NodePlacement> placements,
        IReadOnlyList<DiagramResourceGroupPacker.ResourceGroupFrameBounds> resourceGroupFrames,
        IReadOnlyList<DiagramForestNestedFrameBounds> nestedFrames,
        string title)
    {
        if (!IsVnetPrimaryTitle(title))
        {
            return (
                [],
                new HashSet<string>(StringComparer.Ordinal),
                new Dictionary<string, FrameEdgeRoute>(),
                new Dictionary<string, BundleEndpointIds>());
        }

        Dictionary<string, NodePlacement> placementById = placements.ToDictionary(
            placement => placement.Node.NodeId,
            StringComparer.Ordinal);
        Dictionary<(string ResourceGroupFrameId, string VnetFrameId), List<DiagramEdge>> candidates = [];

        foreach (DiagramEdge edge in visibleEdges)
        {
            if (!IsPrivateEndpointEdge(edge)
                || !placementById.TryGetValue(edge.FromNodeId, out NodePlacement? from)
                || !placementById.TryGetValue(edge.ToNodeId, out NodePlacement? to))
            {
                continue;
            }

            NodePlacement? resourcePlacement = from.FrameCellId is not null && from.VnetFrameId is null
                ? from
                : to.FrameCellId is not null && to.VnetFrameId is null
                    ? to
                    : null;
            NodePlacement? vnetPlacement = from.VnetFrameId is not null
                ? from
                : to.VnetFrameId is not null
                    ? to
                    : null;
            if (resourcePlacement?.FrameCellId is null || vnetPlacement?.VnetFrameId is null)
            {
                continue;
            }

            var framePair = (
                ResourceGroupFrameId: resourcePlacement.FrameCellId,
                VnetFrameId: vnetPlacement.VnetFrameId);
            if (!candidates.TryGetValue(framePair, out List<DiagramEdge>? group))
            {
                group = [];
                candidates[framePair] = group;
            }

            group.Add(edge);
        }

        List<DiagramEdge> bundledEdges = [];
        HashSet<string> bundledOriginalKeys = new(StringComparer.Ordinal);
        Dictionary<string, FrameEdgeRoute> bundledRoutes = new(StringComparer.Ordinal);
        Dictionary<string, BundleEndpointIds> bundledEndpointIds = new(StringComparer.Ordinal);
        foreach (((string resourceFrameId, string vnetFrameId), List<DiagramEdge> edges) in candidates)
        {
            if (edges.Count < 2)
            {
                continue;
            }

            DiagramResourceGroupPacker.ResourceGroupFrameBounds? resourceFrame =
                resourceGroupFrames.FirstOrDefault(frame =>
                    string.Equals(frame.FrameCellId, resourceFrameId, StringComparison.Ordinal));
            DiagramForestNestedFrameBounds? vnetFrame = nestedFrames.FirstOrDefault(frame =>
                string.Equals(frame.FrameId, vnetFrameId, StringComparison.Ordinal));
            if (resourceFrame is null || vnetFrame is null)
            {
                continue;
            }

            DiagramEdge representative = edges[0];
            DiagramEdge bundledEdge = new()
            {
                FromNodeId = representative.FromNodeId,
                ToNodeId = representative.ToNodeId,
                Label = $"private endpoint × {edges.Count}",
                InferenceSource = representative.InferenceSource,
                ProvenanceKind = representative.ProvenanceKind,
            };
            bundledEdges.Add(bundledEdge);
            bundledOriginalKeys.UnionWith(edges.Select(DiagramForestEdgeLabelCollapse.EdgeKey));
            string bundledEdgeKey = DiagramForestEdgeLabelCollapse.EdgeKey(bundledEdge);
            bundledRoutes[bundledEdgeKey] =
                ResolveFrameEdgeRoute(resourceFrame, vnetFrame);
            bundledEndpointIds[bundledEdgeKey] = new BundleEndpointIds(
                edges
                    .Select(edge => MermaidIdSanitizer.Sanitize(edge.FromNodeId))
                    .Distinct(StringComparer.Ordinal)
                    .OrderBy(id => id, StringComparer.Ordinal)
                    .ToArray(),
                edges
                    .Select(edge => MermaidIdSanitizer.Sanitize(edge.ToNodeId))
                    .Distinct(StringComparer.Ordinal)
                    .OrderBy(id => id, StringComparer.Ordinal)
                    .ToArray());
        }

        return (bundledEdges, bundledOriginalKeys, bundledRoutes, bundledEndpointIds);
    }

    private static bool IsPrivateEndpointEdge(DiagramEdge edge)
    {
        return string.Equals(edge.Label?.Trim(), "private endpoint", StringComparison.OrdinalIgnoreCase)
            && string.Equals(
                edge.InferenceSource,
                GraphEdgeInferenceSources.InventoryPrivateEndpoint,
                StringComparison.OrdinalIgnoreCase);
    }

    private static FrameEdgeRoute ResolveFrameEdgeRoute(
        DiagramResourceGroupPacker.ResourceGroupFrameBounds resourceFrame,
        DiagramForestNestedFrameBounds vnetFrame)
    {
        double resourceRight = resourceFrame.X + resourceFrame.Width;
        double vnetRight = vnetFrame.X + vnetFrame.Width;
        double resourceCenterY = resourceFrame.Y + (resourceFrame.Height / 2.0d);
        double vnetCenterY = vnetFrame.Y + (vnetFrame.Height / 2.0d);

        if (resourceRight <= vnetFrame.X)
        {
            return new FrameEdgeRoute(
                resourceRight,
                resourceCenterY,
                vnetFrame.X,
                vnetCenterY);
        }

        if (vnetRight <= resourceFrame.X)
        {
            return new FrameEdgeRoute(
                resourceFrame.X,
                resourceCenterY,
                vnetRight,
                vnetCenterY);
        }

        if (resourceFrame.Y <= vnetFrame.Y)
        {
            return new FrameEdgeRoute(
                resourceFrame.X + (resourceFrame.Width / 2.0d),
                resourceFrame.Y + resourceFrame.Height,
                vnetFrame.X + (vnetFrame.Width / 2.0d),
                vnetFrame.Y);
        }

        return new FrameEdgeRoute(
            resourceFrame.X + (resourceFrame.Width / 2.0d),
            resourceFrame.Y,
            vnetFrame.X + (vnetFrame.Width / 2.0d),
            vnetFrame.Y + vnetFrame.Height);
    }

    private static IReadOnlyList<DiagramEdge> ResolveVnetInternalPlacementEdges(
        IReadOnlyList<DiagramNode> nodes,
        IReadOnlyList<DiagramEdge> edges)
    {
        Dictionary<string, DiagramNode> nodesById = nodes.ToDictionary(
            node => node.NodeId,
            StringComparer.Ordinal);
        HashSet<string> suppressed = [];

        foreach (IReadOnlySet<string> members in DiagramForestVnetMembership
                     .Resolve(nodes, edges, sameResourceGroupOnly: true)
                     .Values)
        {
            foreach (DiagramEdge edge in edges)
            {
                if (DiagramForestEdgeLabelCollapse.IsPeeringEdge(edge)
                    || !DiagramForestVnetMembership.IsCitedPlacementEdge(edge)
                    || !members.Contains(edge.FromNodeId)
                    || !members.Contains(edge.ToNodeId)
                    || !nodesById.ContainsKey(edge.FromNodeId)
                    || !nodesById.ContainsKey(edge.ToNodeId))
                {
                    continue;
                }

                suppressed.Add(DiagramForestEdgeLabelCollapse.EdgeKey(edge));
            }
        }

        return edges
            .Where(edge => suppressed.Contains(DiagramForestEdgeLabelCollapse.EdgeKey(edge)))
            .ToList();
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
