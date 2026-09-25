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

        Dictionary<string, string> armIdToNodeId = BuildArmIdToNodeIdMap(graph.Nodes);
        HashSet<string> avdOnlyNodeIds = [];
        Dictionary<string, string> nodeIdToHostPoolArmId = new(StringComparer.Ordinal);

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

            if (IsAvdOnlySessionHostVirtualMachine(node, graph, avdOnlyNodeIds))
            {
                avdOnlyNodeIds.Add(node.NodeId);
                string? hostPoolArmId = ResolveHostPoolArmIdForSessionHostVm(node, graph, armIdToNodeId);
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
        IReadOnlySet<string> avdOnlyNodeIds)
    {
        string armType = ReadArmType(node);

        if (!armType.Contains("virtualMachines", StringComparison.OrdinalIgnoreCase)
            && !armType.Contains("virtualMachineScaleSets", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!IsSessionHostBackingTarget(node.NodeId, graph))
        {
            return false;
        }

        return !HasProvenNonAvdRole(node.NodeId, graph, avdOnlyNodeIds);
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

    private static bool HasProvenNonAvdRole(
        string nodeId,
        GraphSnapshot graph,
        IReadOnlySet<string> avdOnlyNodeIds)
    {
        foreach (GraphEdge edge in EnumerateIncidentEdges(graph, nodeId))
        {
            if (edge.Weight < MinimumEdgeWeight)
            {
                continue;
            }

            if (string.Equals(
                    edge.InferenceSource,
                    InventoryDiagramAvdEdgeSources.SessionHostToVm,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string otherNodeId = string.Equals(edge.FromNodeId, nodeId, StringComparison.Ordinal)
                ? edge.ToNodeId
                : edge.FromNodeId;

            if (!avdOnlyNodeIds.Contains(otherNodeId))
            {
                return true;
            }
        }

        return false;
    }

    private static string? ResolveHostPoolArmIdForSessionHostVm(
        GraphNode vmNode,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> armIdToNodeId)
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

            if (!armIdToNodeId.TryGetValue(ReadArmIdByNodeId(graph, edge.FromNodeId), out _))
            {
                continue;
            }

            string? hostPoolArmId = InventoryDiagramAvdClassifier.TryReadHostPoolArmId(ReadArmIdByNodeId(graph, edge.FromNodeId));

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

    private static Dictionary<string, string> BuildArmIdToNodeIdMap(IReadOnlyList<GraphNode> nodes)
    {
        Dictionary<string, string> armIdToNodeId = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in nodes)
        {
            string armId = ReadArmId(node);

            if (!string.IsNullOrWhiteSpace(armId))
            {
                armIdToNodeId[ArmResourceIdNormalizer.Normalize(armId)] = node.NodeId;
            }
        }

        return armIdToNodeId;
    }

    private static string ReadArmIdByNodeId(GraphSnapshot graph, string nodeId)
    {
        GraphNode? node = graph.Nodes.FirstOrDefault(candidate =>
            string.Equals(candidate.NodeId, nodeId, StringComparison.Ordinal));

        return node is null ? string.Empty : ReadArmId(node);
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
