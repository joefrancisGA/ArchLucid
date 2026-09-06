using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>Links requirements to datastore topology nodes and checks replica evidence (DX-08).</summary>
public static class DrRpoTopologyAnalyzer
{
    public const int MaxFindings = 20;

    public const int MaxLinkHopCount = 3;

    public static IReadOnlyList<DrRpoTopologyGap> Analyze(GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        if (graphSnapshot.Nodes is null || graphSnapshot.Nodes.Count == 0)
        {
            return [];
        }

        Dictionary<string, GraphNode> nodesById = graphSnapshot.Nodes
            .Where(static node => !string.IsNullOrWhiteSpace(node.NodeId))
            .GroupBy(static node => node.NodeId.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(static group => group.Key, static group => group.First(), StringComparer.OrdinalIgnoreCase);

        Dictionary<string, List<string>> adjacency = BuildAdjacency(graphSnapshot, nodesById);
        List<DrRpoTopologyGap> gaps = [];

        foreach (GraphNode requirement in graphSnapshot.GetNodesByType(GraphNodeTypes.Requirement))
        {
            if (!DrRpoRequirementParser.TryParseRecoveryObjectives(
                    requirement.Label,
                    requirement.Properties,
                    out int? rpoMinutes,
                    out int? rtoMinutes))
            {
                continue;
            }

            IReadOnlyList<GraphNode> datastores = FindLinkedDatastores(
                graphSnapshot,
                requirement.NodeId,
                nodesById,
                adjacency);

            if (datastores.Count == 0)
            {
                continue;
            }

            foreach (GraphNode datastore in datastores)
            {
                if (DrReplicaPropertyHeuristic.HasReplicaEvidence(datastore.Properties))
                {
                    continue;
                }

                gaps.Add(new DrRpoTopologyGap(
                    requirement.NodeId,
                    ResolveLabel(requirement),
                    rpoMinutes,
                    rtoMinutes,
                    datastore.NodeId,
                    ResolveLabel(datastore)));

                if (gaps.Count >= MaxFindings)
                {
                    return gaps;
                }
            }
        }

        return gaps;
    }

    private static IReadOnlyList<GraphNode> FindLinkedDatastores(
        GraphSnapshot graphSnapshot,
        string requirementNodeId,
        IReadOnlyDictionary<string, GraphNode> nodesById,
        IReadOnlyDictionary<string, List<string>> adjacency)
    {
        HashSet<string> visited = new(StringComparer.OrdinalIgnoreCase);
        Queue<(string NodeId, int HopCount)> queue = new();

        foreach (GraphNode directTarget in graphSnapshot.GetOutgoingTargets(
                     requirementNodeId,
                     GraphEdgeTypes.RelatesTo,
                     GraphEdgeDecisioningThresholds.MinWeightForSemanticLink))
        {
            queue.Enqueue((directTarget.NodeId, 0));
            visited.Add(directTarget.NodeId);
        }

        List<GraphNode> datastores = [];

        while (queue.Count > 0)
        {
            (string nodeId, int hopCount) = queue.Dequeue();

            if (!nodesById.TryGetValue(nodeId, out GraphNode? node))
            {
                continue;
            }

            if (IsDatastoreTopologyNode(node))
            {
                datastores.Add(node);
            }

            if (hopCount >= MaxLinkHopCount)
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
                queue.Enqueue((neighborId, hopCount + 1));
            }
        }

        return datastores
            .GroupBy(static node => node.NodeId, StringComparer.OrdinalIgnoreCase)
            .Select(static group => group.First())
            .ToList();
    }

    private static bool IsDatastoreTopologyNode(GraphNode node)
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
            || combined.Contains("mysql", StringComparison.Ordinal)
            || combined.Contains("cluster", StringComparison.Ordinal);
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

    private static string ResolveLabel(GraphNode node) =>
        string.IsNullOrWhiteSpace(node.Label) ? node.NodeId : node.Label.Trim();

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
