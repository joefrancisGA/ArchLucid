namespace ArchLucid.KnowledgeGraph.Models;

public static class GraphSnapshotExtensions
{
    extension(GraphSnapshot snapshot)
    {
        public IReadOnlyList<GraphNode> GetNodesByType(string nodeType)
        {
            ArgumentNullException.ThrowIfNull(snapshot);

            string normalizedNodeType = NormalizeGraphField(nodeType);

            return snapshot.Nodes
                .Where(x => string.Equals(NormalizeGraphField(x.NodeType), normalizedNodeType, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        public IReadOnlyList<GraphEdge> GetEdgesByType(string edgeType)
        {
            ArgumentNullException.ThrowIfNull(snapshot);

            string normalizedEdgeType = NormalizeGraphField(edgeType);

            return snapshot.Edges
                .Where(x => string.Equals(NormalizeGraphField(x.EdgeType), normalizedEdgeType, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        public IReadOnlyList<GraphNode> GetOutgoingTargets(string fromNodeId,
            string edgeType,
            double minWeightInclusive = 0)
        {
            ArgumentNullException.ThrowIfNull(snapshot);

            string normalizedFromNodeId = NormalizeNodeId(fromNodeId);
            string normalizedEdgeType = NormalizeGraphField(edgeType);

            HashSet<string> targetIds = snapshot.Edges
                .Where(x =>
                    string.Equals(NormalizeNodeId(x.FromNodeId), normalizedFromNodeId, StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(NormalizeGraphField(x.EdgeType), normalizedEdgeType, StringComparison.OrdinalIgnoreCase) &&
                    x.Weight >= minWeightInclusive)
                .Select(x => NormalizeNodeId(x.ToNodeId))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            return snapshot.Nodes
                .Where(x => targetIds.Contains(NormalizeNodeId(x.NodeId)))
                .ToList();
        }

        /// <summary>
        ///     Nodes that have an incoming <paramref name="edgeType" /> edge to <paramref name="toNodeId" />.
        /// </summary>
        public IReadOnlyList<GraphNode> GetIncomingSources(string toNodeId,
            string edgeType)
        {
            ArgumentNullException.ThrowIfNull(snapshot);

            string normalizedToNodeId = NormalizeNodeId(toNodeId);
            string normalizedEdgeType = NormalizeGraphField(edgeType);

            HashSet<string> sourceIds = snapshot.Edges
                .Where(x =>
                    string.Equals(NormalizeNodeId(x.ToNodeId), normalizedToNodeId, StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(NormalizeGraphField(x.EdgeType), normalizedEdgeType, StringComparison.OrdinalIgnoreCase))
                .Select(x => NormalizeNodeId(x.FromNodeId))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            return snapshot.Nodes
                .Where(x => sourceIds.Contains(NormalizeNodeId(x.NodeId)))
                .ToList();
        }
    }

    private static string NormalizeNodeId(string nodeId) => nodeId.Trim();

    private static string NormalizeGraphField(string value) => (value ?? string.Empty).Trim();
}
