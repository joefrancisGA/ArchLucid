using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Retrieval;

namespace ArchLucid.Retrieval.Graph;

/// <summary>Louvain modularity community detection over undirected graph edges (TB-877).</summary>
public sealed class LouvainGraphCommunityDetector : IGraphCommunityDetector
{
    /// <inheritdoc />
    public IReadOnlyList<GraphCommunity> DetectCommunities(GraphSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        if (snapshot.Nodes is not { Count: > 0 })
            return [];

        Dictionary<string, int> nodeIndexById = BuildNodeIndex(snapshot.Nodes);
        List<HashSet<int>> adjacency = BuildUndirectedAdjacency(snapshot.Edges, nodeIndexById);

        if (adjacency.Count == 0)
            return [];

        int[] communityByNode = Enumerable.Range(0, adjacency.Count).ToArray();
        bool moved = true;
        int guard = 0;

        while (moved && guard < 32)
        {
            guard++;
            moved = false;

            foreach (int node in Enumerable.Range(0, adjacency.Count).OrderBy(static i => i))
            {
                int bestCommunity = communityByNode[node];
                double bestGain = 0;

                foreach (int neighbor in adjacency[node])
                {
                    int neighborCommunity = communityByNode[neighbor];
                    double gain = ModularityGain(communityByNode, adjacency, node, neighborCommunity);

                    if (gain > bestGain + 1e-9)
                    {
                        bestGain = gain;
                        bestCommunity = neighborCommunity;
                    }
                }

                if (bestCommunity != communityByNode[node])
                {
                    communityByNode[node] = bestCommunity;
                    moved = true;
                }
            }
        }

        Dictionary<int, List<string>> membersByCommunity = [];

        foreach ((string nodeId, int index) in nodeIndexById)
        {
            int community = communityByNode[index];

            if (!membersByCommunity.TryGetValue(community, out List<string>? members))
            {
                members = [];
                membersByCommunity[community] = members;
            }

            members.Add(nodeId);
        }

        List<GraphCommunity> communities = [];
        int communityOrdinal = 0;

        foreach (KeyValuePair<int, List<string>> entry in membersByCommunity.OrderBy(static pair => pair.Key))
        {
            if (entry.Value.Count == 0)
                continue;

            communities.Add(new GraphCommunity
            {
                CommunityId = $"community-{communityOrdinal++}",
                MemberNodeIds = entry.Value.OrderBy(static id => id, StringComparer.Ordinal).ToArray(),
            });
        }

        return communities;
    }

    private static Dictionary<string, int> BuildNodeIndex(IReadOnlyList<GraphNode> nodes)
    {
        Dictionary<string, int> nodeIndexById = new(StringComparer.Ordinal);

        for (int index = 0; index < nodes.Count; index++)
        {
            GraphNode node = nodes[index];

            if (string.IsNullOrWhiteSpace(node.NodeId))
                continue;

            if (!nodeIndexById.ContainsKey(node.NodeId))
                nodeIndexById[node.NodeId] = nodeIndexById.Count;
        }

        return nodeIndexById;
    }

    private static List<HashSet<int>> BuildUndirectedAdjacency(
        IReadOnlyList<GraphEdge> edges,
        IReadOnlyDictionary<string, int> nodeIndexById)
    {
        int nodeCount = nodeIndexById.Count;
        List<HashSet<int>> adjacency = [];

        for (int i = 0; i < nodeCount; i++)
            adjacency.Add([]);

        if (edges is not { Count: > 0 })
            return adjacency;

        foreach (GraphEdge edge in edges)
        {
            if (!TryResolveNodeIndex(edge.FromNodeId, nodeIndexById, out int source)
                || !TryResolveNodeIndex(edge.ToNodeId, nodeIndexById, out int target))
                continue;

            if (source == target)
                continue;

            adjacency[source].Add(target);
            adjacency[target].Add(source);
        }

        return adjacency;
    }

    private static bool TryResolveNodeIndex(
        string? nodeId,
        IReadOnlyDictionary<string, int> nodeIndexById,
        out int index)
    {
        index = 0;

        if (string.IsNullOrWhiteSpace(nodeId))
            return false;

        return nodeIndexById.TryGetValue(nodeId.Trim(), out index);
    }

    private static double ModularityGain(
        int[] communityByNode,
        IReadOnlyList<HashSet<int>> adjacency,
        int node,
        int targetCommunity)
    {
        if (communityByNode[node] == targetCommunity)
            return 0;

        int internalEdges = 0;

        foreach (int neighbor in adjacency[node])
        {
            if (communityByNode[neighbor] == targetCommunity)
                internalEdges++;
        }

        return internalEdges;
    }
}
