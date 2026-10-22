using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Replaces hidden AVD internals with one collapsed Azure Virtual Desktop boundary per host pool (NR-06, NR-14).
/// </summary>
internal static class InventoryDiagramAvdBoundaryApplier
{
    public static void Apply(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId,
        DiagramMode mode,
        DiagramAstCompileOptions? options)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);

        if (mode == DiagramMode.Avd || options?.IncludeAvdAssets == true)
        {
            return;
        }

        InventoryDiagramAvdScopeResult scope = InventoryDiagramAvdScopeResolver.Resolve(graph);
        (int hostPoolCount, int sessionHostCount) = CountOmittedAvdSummary(scope, graph);

        if (ast.Nodes.Count == 0 && hostPoolCount == 0 && sessionHostCount == 0)
        {
            return;
        }

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
                    Label = BuildCollapsedBoundaryLabel(hostPoolCount, sessionHostCount),
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

        if (boundaryNodes.Count == 0 && (hostPoolCount > 0 || sessionHostCount > 0))
        {
            string boundaryDiagramNodeId = ResolveBoundaryDiagramNodeId("avd-summary", hostPoolArmIdToBoundaryNodeId);
            boundaryNodes[boundaryDiagramNodeId] = new DiagramNode
            {
                NodeId = boundaryDiagramNodeId,
                Label = BuildCollapsedBoundaryLabel(hostPoolCount, sessionHostCount),
                NodeType = "avd-boundary",
                OrderKey = ast.Nodes.Count,
                IsAvdCollapsedBoundary = true,
            };
        }
        else
        {
            foreach (DiagramNode boundaryNode in boundaryNodes.Values)
            {
                boundaryNode.Label = BuildCollapsedBoundaryLabel(hostPoolCount, sessionHostCount);
            }
        }

        foreach (DiagramNode boundaryNode in boundaryNodes.Values.OrderBy(node => node.NodeId, StringComparer.Ordinal))
        {
            ast.Nodes.Add(boundaryNode);
        }
    }

    private static (int HostPools, int SessionHosts) CountOmittedAvdSummary(
        InventoryDiagramAvdScopeResult scope,
        GraphSnapshot graph)
    {
        int hostPools = 0;
        int sessionHosts = 0;

        foreach (GraphNode node in graph.Nodes)
        {
            if (!scope.AvdOnlyNodeIds.Contains(node.NodeId))
            {
                continue;
            }

            string armType = node.Properties.TryGetValue("arm.type", out string? armTypeValue)
                ? armTypeValue
                : string.Empty;

            if (armType.Equals("Microsoft.DesktopVirtualization/hostPools", StringComparison.OrdinalIgnoreCase))
            {
                hostPools++;
                continue;
            }

            if (armType.Contains("virtualMachines", StringComparison.OrdinalIgnoreCase)
                || armType.Contains("virtualMachineScaleSets", StringComparison.OrdinalIgnoreCase))
            {
                sessionHosts++;
            }
        }

        return (hostPools, sessionHosts);
    }

    private static string BuildCollapsedBoundaryLabel(int hostPoolCount, int sessionHostCount)
    {
        string hostPoolWord = hostPoolCount == 1 ? "host pool" : "host pools";
        string sessionHostWord = sessionHostCount == 1 ? "session host" : "session hosts";

        return $"{InventoryDiagramAvdResourceMapping.CollapsedBoundaryLabel} · {hostPoolCount} {hostPoolWord} · {sessionHostCount} {sessionHostWord}";
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
