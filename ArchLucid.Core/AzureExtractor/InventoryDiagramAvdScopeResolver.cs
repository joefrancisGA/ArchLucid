using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Resolves which inventory nodes are AVD-only versus shared across diagram views (NR-06).</summary>
public static class InventoryDiagramAvdScopeResolver
{
    public static InventoryDiagramAvdScopeResult Resolve(GraphSnapshot graph)
    {
        ArgumentNullException.ThrowIfNull(graph);

        Dictionary<string, GraphNode> nodesById = graph.Nodes
            .GroupBy(node => node.NodeId, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        HashSet<string> avdOnlyNodeIds = [];
        Dictionary<string, string> nodeIdToHostPoolArmId = new(StringComparer.Ordinal);
        HashSet<string> sessionHostLastSegments = BuildSessionHostLastSegments(graph);

        foreach (GraphNode node in graph.Nodes)
        {
            string armType = ReadArmType(node);
            string armId = ReadArmId(node);

            if (InventoryDiagramAvdClassifier.TryClassify(armType, armId, out _))
            {
                avdOnlyNodeIds.Add(node.NodeId);
                string? hostPoolArmId = InventoryDiagramAvdClassifier.TryReadHostPoolArmId(armId) ?? armId;
                nodeIdToHostPoolArmId[node.NodeId] = hostPoolArmId;
            }
        }

        foreach (GraphNode node in graph.Nodes)
        {
            if (avdOnlyNodeIds.Contains(node.NodeId))
            {
                continue;
            }

            if (IsAvdOnlySessionHostVirtualMachine(node, graph, sessionHostLastSegments))
            {
                avdOnlyNodeIds.Add(node.NodeId);
                string? hostPoolArmId = ResolveHostPoolArmIdForSessionHostVm(node, graph, nodesById, sessionHostLastSegments);
                if (!string.IsNullOrWhiteSpace(hostPoolArmId))
                {
                    nodeIdToHostPoolArmId[node.NodeId] = hostPoolArmId;
                }
            }
        }

        PropagateExclusiveSupportingResources(graph, nodesById, avdOnlyNodeIds, nodeIdToHostPoolArmId);

        HashSet<string> sharedBoundaryNodeIds = [];

        foreach (GraphEdge edge in graph.Edges)
        {
            if (edge.Weight < MinimumEdgeWeight)
            {
                continue;
            }

            bool fromAvdOnly = avdOnlyNodeIds.Contains(edge.FromNodeId);
            bool toAvdOnly = avdOnlyNodeIds.Contains(edge.ToNodeId);

            if (fromAvdOnly && !toAvdOnly)
            {
                sharedBoundaryNodeIds.Add(edge.ToNodeId);
            }

            if (toAvdOnly && !fromAvdOnly)
            {
                sharedBoundaryNodeIds.Add(edge.FromNodeId);
            }
        }

        return new InventoryDiagramAvdScopeResult
        {
            AvdOnlyNodeIds = avdOnlyNodeIds,
            NodeIdToHostPoolArmId = nodeIdToHostPoolArmId,
            SharedBoundaryNodeIds = sharedBoundaryNodeIds,
        };
    }

    private const double MinimumEdgeWeight = 0.5d;

    private static void PropagateExclusiveSupportingResources(
        GraphSnapshot graph,
        IReadOnlyDictionary<string, GraphNode> nodesById,
        HashSet<string> avdOnlyNodeIds,
        Dictionary<string, string> nodeIdToHostPoolArmId)
    {
        bool changed = true;

        while (changed)
        {
            changed = false;

            foreach (GraphNode node in graph.Nodes)
            {
                if (avdOnlyNodeIds.Contains(node.NodeId))
                {
                    continue;
                }

                if (!InventoryDiagramAvdClassifier.IsExclusiveSupportingArmType(ReadArmType(node)))
                {
                    continue;
                }

                if (!IsExclusivelyConnectedToAvdOnlyNodes(node.NodeId, graph, avdOnlyNodeIds))
                {
                    continue;
                }

                avdOnlyNodeIds.Add(node.NodeId);
                changed = true;

                string? hostPoolArmId = ResolveDominantHostPoolArmId(node.NodeId, graph, avdOnlyNodeIds, nodeIdToHostPoolArmId);

                if (!string.IsNullOrWhiteSpace(hostPoolArmId))
                {
                    nodeIdToHostPoolArmId[node.NodeId] = hostPoolArmId;
                }
            }
        }
    }

    private static bool IsExclusivelyConnectedToAvdOnlyNodes(
        string nodeId,
        GraphSnapshot graph,
        IReadOnlySet<string> avdOnlyNodeIds)
    {
        bool hasCitedEdge = false;

        foreach (GraphEdge edge in EnumerateIncidentEdges(graph, nodeId))
        {
            if (edge.Weight < MinimumEdgeWeight)
            {
                continue;
            }

            hasCitedEdge = true;
            string otherNodeId = string.Equals(edge.FromNodeId, nodeId, StringComparison.Ordinal)
                ? edge.ToNodeId
                : edge.FromNodeId;

            if (!avdOnlyNodeIds.Contains(otherNodeId))
            {
                return false;
            }
        }

        return hasCitedEdge;
    }

    private static bool IsAvdOnlySessionHostVirtualMachine(
        GraphNode node,
        GraphSnapshot graph,
        IReadOnlySet<string> sessionHostLastSegments)
    {
        string armType = ReadArmType(node);

        if (!armType.Contains("virtualMachines", StringComparison.OrdinalIgnoreCase)
            && !armType.Contains("virtualMachineScaleSets", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (IsSessionHostBackingTarget(node.NodeId, graph)
            || MatchesSessionHostLastSegment(ReadArmId(node), sessionHostLastSegments))
        {
            return true;
        }

        return false;
    }

    private static HashSet<string> BuildSessionHostLastSegments(GraphSnapshot graph)
    {
        HashSet<string> segments = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in graph.Nodes)
        {
            string armType = ReadArmType(node);
            string armId = ReadArmId(node);

            if (!armType.Contains("sessionHosts", StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(armId))
            {
                continue;
            }

            string? lastSegment = ReadLastArmSegment(armId);

            if (!string.IsNullOrWhiteSpace(lastSegment))
            {
                segments.Add(lastSegment);
            }
        }

        return segments;
    }

    private static bool MatchesSessionHostLastSegment(string armId, IReadOnlySet<string> sessionHostLastSegments)
    {
        string? vmLastSegment = ReadLastArmSegment(armId);

        return !string.IsNullOrWhiteSpace(vmLastSegment)
            && sessionHostLastSegments.Contains(vmLastSegment);
    }

    private static string? ReadLastArmSegment(string armId)
    {
        if (string.IsNullOrWhiteSpace(armId))
        {
            return null;
        }

        int slash = armId.LastIndexOf('/');

        return slash < 0 ? armId.Trim() : armId[(slash + 1)..].Trim();
    }

    private static bool IsSessionHostBackingTarget(string nodeId, GraphSnapshot graph)
    {
        return graph.Edges.Any(edge =>
            edge.Weight >= MinimumEdgeWeight
            && string.Equals(edge.ToNodeId, nodeId, StringComparison.Ordinal)
            && string.Equals(
                edge.InferenceSource,
                InventoryDiagramAvdEdgeSources.SessionHostToVm,
                StringComparison.OrdinalIgnoreCase));
    }

    private static string? ResolveHostPoolArmIdForSessionHostVm(
        GraphNode vmNode,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, GraphNode> nodesById,
        IReadOnlySet<string> sessionHostLastSegments)
    {
        foreach (GraphEdge edge in graph.Edges)
        {
            if (edge.Weight < MinimumEdgeWeight
                || !string.Equals(edge.ToNodeId, vmNode.NodeId, StringComparison.Ordinal)
                || !string.Equals(
                    edge.InferenceSource,
                    InventoryDiagramAvdEdgeSources.SessionHostToVm,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!nodesById.TryGetValue(edge.FromNodeId, out GraphNode? hostNode))
            {
                continue;
            }

            string? hostPoolArmId = InventoryDiagramAvdClassifier.TryReadHostPoolArmId(ReadArmId(hostNode));

            if (!string.IsNullOrWhiteSpace(hostPoolArmId))
            {
                return hostPoolArmId;
            }
        }

        string? vmLastSegment = ReadLastArmSegment(ReadArmId(vmNode));

        if (string.IsNullOrWhiteSpace(vmLastSegment))
        {
            return null;
        }

        foreach (GraphNode hostNode in graph.Nodes)
        {
            if (!ReadArmType(hostNode).Contains("sessionHosts", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!string.Equals(ReadLastArmSegment(ReadArmId(hostNode)), vmLastSegment, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string? hostPoolArmId = InventoryDiagramAvdClassifier.TryReadHostPoolArmId(ReadArmId(hostNode));

            if (!string.IsNullOrWhiteSpace(hostPoolArmId))
            {
                return hostPoolArmId;
            }
        }

        return null;
    }

    private static string? ResolveDominantHostPoolArmId(
        string nodeId,
        GraphSnapshot graph,
        IReadOnlySet<string> avdOnlyNodeIds,
        IReadOnlyDictionary<string, string> nodeIdToHostPoolArmId)
    {
        Dictionary<string, int> hostPoolCounts = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphEdge edge in EnumerateIncidentEdges(graph, nodeId))
        {
            if (edge.Weight < MinimumEdgeWeight)
            {
                continue;
            }

            string otherNodeId = string.Equals(edge.FromNodeId, nodeId, StringComparison.Ordinal)
                ? edge.ToNodeId
                : edge.FromNodeId;

            if (!avdOnlyNodeIds.Contains(otherNodeId)
                || !nodeIdToHostPoolArmId.TryGetValue(otherNodeId, out string? hostPoolArmId))
            {
                continue;
            }

            hostPoolCounts[hostPoolArmId] = hostPoolCounts.TryGetValue(hostPoolArmId, out int count) ? count + 1 : 1;
        }

        return hostPoolCounts
            .OrderByDescending(pair => pair.Value)
            .ThenBy(pair => pair.Key, StringComparer.Ordinal)
            .Select(pair => pair.Key)
            .FirstOrDefault();
    }

    private static IEnumerable<GraphEdge> EnumerateIncidentEdges(GraphSnapshot graph, string nodeId)
    {
        foreach (GraphEdge edge in graph.Edges)
        {
            if (string.Equals(edge.FromNodeId, nodeId, StringComparison.Ordinal)
                || string.Equals(edge.ToNodeId, nodeId, StringComparison.Ordinal))
            {
                yield return edge;
            }
        }
    }

    private static string ReadArmType(GraphNode node)
    {
        return node.Properties.TryGetValue("arm.type", out string? armType)
            ? armType
            : string.Empty;
    }

    private static string ReadArmId(GraphNode node)
    {
        return node.Properties.TryGetValue("arm.id", out string? armId)
            ? armId
            : string.Empty;
    }
}
