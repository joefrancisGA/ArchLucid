using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>Graph reachability from segmentation controls to datastores or jump boxes (DX-07).</summary>
public static class SegmentationSemanticsPathAnalyzer
{
    public const int MaxHopCount = 3;

    public static bool HasPathToSensitiveTarget(
        GraphSnapshot graphSnapshot,
        string segmentationNodeId,
        out GraphNode? targetNode,
        out int hopCount)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        targetNode = null;
        hopCount = 0;

        if (string.IsNullOrWhiteSpace(segmentationNodeId))
        {
            return false;
        }

        if (graphSnapshot.Nodes is null || graphSnapshot.Nodes.Count == 0)
        {
            return false;
        }

        Dictionary<string, GraphNode> nodesById = graphSnapshot.Nodes
            .Where(static node => !string.IsNullOrWhiteSpace(node.NodeId))
            .GroupBy(static node => node.NodeId.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(static group => group.Key, static group => group.First(), StringComparer.OrdinalIgnoreCase);

        if (!nodesById.ContainsKey(segmentationNodeId))
        {
            return false;
        }

        Dictionary<string, List<string>> adjacency = BuildAdjacency(graphSnapshot, nodesById);

        Queue<(string NodeId, int HopCount)> queue = new();
        HashSet<string> visited = new(StringComparer.OrdinalIgnoreCase)
        {
            segmentationNodeId,
        };

        queue.Enqueue((segmentationNodeId, 0));

        while (queue.Count > 0)
        {
            (string nodeId, int currentHopCount) = queue.Dequeue();

            if (currentHopCount >= MaxHopCount)
            {
                continue;
            }

            if (!adjacency.TryGetValue(nodeId, out List<string>? neighbors))
            {
                continue;
            }

            foreach (string neighborId in neighbors)
            {
                if (visited.Contains(neighborId))
                {
                    continue;
                }

                visited.Add(neighborId);

                if (!nodesById.TryGetValue(neighborId, out GraphNode? neighbor))
                {
                    continue;
                }

                int nextHopCount = currentHopCount + 1;

                if (IsSensitiveTarget(neighbor))
                {
                    targetNode = neighbor;
                    hopCount = nextHopCount;

                    return true;
                }

                queue.Enqueue((neighborId, nextHopCount));
            }
        }

        return false;
    }

    public static bool IsSegmentationControlNode(GraphNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        if (TryGetProperty(node.Properties, "k8s.networkPolicyIngress", out _))
        {
            return true;
        }

        if (TryGetProperty(node.Properties, "k8s.kind", out string? k8sKind)
            && string.Equals(k8sKind, "networkpolicy", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (TryGetProperty(node.Properties, "terraformType", out string? terraformType)
            && IsSegmentationTerraformType(terraformType))
        {
            return true;
        }

        if (TryGetProperty(node.Properties, "resourceType", out string? resourceType)
            && IsSegmentationResourceType(resourceType))
        {
            return true;
        }

        return false;
    }

    public static bool IsSensitiveTarget(GraphNode node)
    {
        if (IsDatastoreNode(node))
        {
            return true;
        }

        return IsJumpBoxNode(node);
    }

    private static bool IsDatastoreNode(GraphNode node)
    {
        if (!string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (TryGetProperty(node.Properties, "category", out string? category)
            && (string.Equals(category, GraphTopologyCategories.Data, StringComparison.OrdinalIgnoreCase)
                || string.Equals(category, GraphTopologyCategories.Storage, StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        string combined = $"{node.Label} {node.SourceId}".ToLowerInvariant();

        return combined.Contains("sql", StringComparison.Ordinal)
            || combined.Contains("storage", StringComparison.Ordinal)
            || combined.Contains("database", StringComparison.Ordinal)
            || combined.Contains("cosmos", StringComparison.Ordinal)
            || combined.Contains("redis", StringComparison.Ordinal)
            || combined.Contains("postgres", StringComparison.Ordinal)
            || combined.Contains("mysql", StringComparison.Ordinal);
    }

    private static bool IsJumpBoxNode(GraphNode node)
    {
        string combined = $"{node.Label} {node.SourceId}".ToLowerInvariant();

        return combined.Contains("jump", StringComparison.Ordinal)
            || combined.Contains("bastion", StringComparison.Ordinal)
            || combined.Contains("admin-host", StringComparison.Ordinal);
    }

    private static bool IsSegmentationTerraformType(string? terraformType)
    {
        if (string.IsNullOrWhiteSpace(terraformType))
        {
            return false;
        }

        return terraformType.Contains("network_security_group", StringComparison.OrdinalIgnoreCase)
            || terraformType.Contains("aws_security_group", StringComparison.OrdinalIgnoreCase)
            || terraformType.Contains("google_compute_firewall", StringComparison.OrdinalIgnoreCase)
            || terraformType.Contains("network_security_rule", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsSegmentationResourceType(string? resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return false;
        }

        return resourceType.Contains("networkSecurityGroups", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("securityGroups", StringComparison.OrdinalIgnoreCase)
            || resourceType.Contains("firewall", StringComparison.OrdinalIgnoreCase);
    }

    private static Dictionary<string, List<string>> BuildAdjacency(
        GraphSnapshot graphSnapshot,
        IReadOnlyDictionary<string, GraphNode> nodesById)
    {
        Dictionary<string, List<string>> adjacency = new(StringComparer.OrdinalIgnoreCase);

        if (graphSnapshot.Edges is null)
        {
            return adjacency;
        }

        foreach (GraphEdge edge in graphSnapshot.Edges)
        {
            if (string.IsNullOrWhiteSpace(edge.FromNodeId)
                || string.IsNullOrWhiteSpace(edge.ToNodeId))
            {
                continue;
            }

            if (!nodesById.ContainsKey(edge.FromNodeId) || !nodesById.ContainsKey(edge.ToNodeId))
            {
                continue;
            }

            AddNeighbor(adjacency, edge.FromNodeId, edge.ToNodeId);
            AddNeighbor(adjacency, edge.ToNodeId, edge.FromNodeId);
        }

        return adjacency;
    }

    private static void AddNeighbor(Dictionary<string, List<string>> adjacency, string fromNodeId, string toNodeId)
    {
        if (!adjacency.TryGetValue(fromNodeId, out List<string>? neighbors))
        {
            neighbors = [];
            adjacency[fromNodeId] = neighbors;
        }

        if (!neighbors.Contains(toNodeId, StringComparer.OrdinalIgnoreCase))
        {
            neighbors.Add(toNodeId);
        }
    }

    private static bool TryGetProperty(
        IReadOnlyDictionary<string, string> properties,
        string key,
        out string? value)
    {
        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(entry.Value))
            {
                value = entry.Value.Trim();

                return true;
            }
        }

        value = null;

        return false;
    }
}
