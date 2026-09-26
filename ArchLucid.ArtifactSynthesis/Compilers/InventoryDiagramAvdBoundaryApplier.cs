using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Replaces hidden AVD internals with one collapsed Azure Virtual Desktop boundary per host pool (NR-06).
/// </summary>
internal static class InventoryDiagramAvdBoundaryApplier
{
    public static void Apply(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        DiagramMode mode)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);

        if (mode == DiagramMode.Avd || ast.Nodes.Count == 0)
        {
            return;
        }

        InventoryDiagramAvdScopeResult scope = InventoryDiagramAvdScopeResolver.Resolve(graph);
        HashSet<string> visibleDiagramNodeIds = ast.Nodes
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        Dictionary<string, string> hostPoolArmIdToBoundaryNodeId = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, DiagramNode> boundaryNodes = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> boundaryEdgeKeys = new(StringComparer.Ordinal);

        foreach (GraphEdge edge in graph.Edges)
        {
            if (edge.Weight < DiagramAstFromGraphCompilerConstants.MinimumEdgeWeight)
            {
                continue;
            }

            bool fromAvdOnly = scope.AvdOnlyNodeIds.Contains(edge.FromNodeId);
            bool toAvdOnly = scope.AvdOnlyNodeIds.Contains(edge.ToNodeId);

            if (fromAvdOnly == toAvdOnly)
            {
                continue;
            }

            string avdNodeId = fromAvdOnly ? edge.FromNodeId : edge.ToNodeId;
            string sharedNodeId = fromAvdOnly ? edge.ToNodeId : edge.FromNodeId;

            if (!graphToDiagramNodeId.TryGetValue(sharedNodeId, out string? sharedDiagramNodeId)
                || !visibleDiagramNodeIds.Contains(sharedDiagramNodeId))
            {
                continue;
            }

            string hostPoolArmId = scope.NodeIdToHostPoolArmId.TryGetValue(avdNodeId, out string? mappedHostPoolArmId)
                && !string.IsNullOrWhiteSpace(mappedHostPoolArmId)
                ? mappedHostPoolArmId
                : "avd";

            string boundaryDiagramNodeId = ResolveBoundaryDiagramNodeId(hostPoolArmId, hostPoolArmIdToBoundaryNodeId);

            if (!boundaryNodes.ContainsKey(boundaryDiagramNodeId))
            {
                DiagramNode boundaryNode = new()
                {
                    NodeId = boundaryDiagramNodeId,
                    Label = InventoryDiagramAvdResourceMapping.CollapsedBoundaryLabel,
                    NodeType = "avd-boundary",
                    OrderKey = ast.Nodes.Count + boundaryNodes.Count,
                    IsAvdCollapsedBoundary = true,
                };

                boundaryNodes[boundaryDiagramNodeId] = boundaryNode;
            }

            string edgeKey = $"{boundaryDiagramNodeId}|{sharedDiagramNodeId}";

            if (!boundaryEdgeKeys.Add(edgeKey))
            {
                continue;
            }

            ast.Edges.Add(new DiagramEdge
            {
                FromNodeId = fromAvdOnly ? boundaryDiagramNodeId : sharedDiagramNodeId,
                ToNodeId = fromAvdOnly ? sharedDiagramNodeId : boundaryDiagramNodeId,
                Label = InventoryDiagramAvdResourceMapping.CollapsedBoundaryLabel,
            });
        }

        foreach (DiagramNode boundaryNode in boundaryNodes.Values.OrderBy(node => node.NodeId, StringComparer.Ordinal))
        {
            ast.Nodes.Add(boundaryNode);
        }
    }

    private static string ResolveBoundaryDiagramNodeId(
        string hostPoolArmId,
        IDictionary<string, string> hostPoolArmIdToBoundaryNodeId)
    {
        if (hostPoolArmIdToBoundaryNodeId.TryGetValue(hostPoolArmId, out string? existing))
        {
            return existing;
        }

        string boundaryNodeId = MermaidIdSanitizer.Sanitize(
            $"{InventoryDiagramAvdResourceMapping.CollapsedBoundaryNodeIdPrefix}{hostPoolArmId}");

        hostPoolArmIdToBoundaryNodeId[hostPoolArmId] = boundaryNodeId;

        return boundaryNodeId;
    }
}
