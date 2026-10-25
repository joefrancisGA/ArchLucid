using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Inference.Rules;

internal sealed class TopologyRelationshipEdgeInferenceRule : IGraphEdgeInferenceRule
{
    private const double WeightTopologyRelationship = 1d;

    public void InferEdges(GraphEdgeInferenceContext context, List<GraphEdge> edges)
    {
        Dictionary<string, GraphNode> topologyById = BuildTopologyLookup(context.TopologyNodes);

        foreach (GraphNode node in context.TopologyNodes)
        {
            AddTargetedEdges(
                edges,
                node,
                CanonicalGraphPropertyKeys.DependsOnNodeIds,
                GraphEdgeTypes.DependsOn,
                "depends on",
                GraphEdgeInferenceSources.TopologyDependsOn,
                topologyById);

            AddTargetedEdges(
                edges,
                node,
                CanonicalGraphPropertyKeys.ExposesToNodeIds,
                GraphEdgeTypes.Exposes,
                "exposes",
                GraphEdgeInferenceSources.TopologyExposes,
                topologyById);

            const string ConnectedToNodeIdsPropertyKey = "connectedToNodeIds";
            if (GraphNodePropertyReader.TryGetPropertyValue(node.Properties, ConnectedToNodeIdsPropertyKey, out string? connectedRaw)
                && !string.IsNullOrWhiteSpace(connectedRaw))
            {
                foreach (string targetId in connectedRaw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                {
                    GraphNode? connectedTarget = ResolveTopologyNode(topologyById, targetId);
                    if (connectedTarget is null)
                        continue;

                    edges.Add(GraphEdgeInferenceHelpers.CreateEdge(
                        node.NodeId,
                        connectedTarget.NodeId,
                        GraphEdgeTypes.ConnectsTo,
                        "connects to",
                        WeightTopologyRelationship,
                        GraphEdgeInferenceSources.TopologyConnectsTo));
                }
            }
        }
    }

    private static void AddTargetedEdges(
        List<GraphEdge> edges,
        GraphNode fromNode,
        string propertyKey,
        string edgeType,
        string label,
        string inferenceSource,
        Dictionary<string, GraphNode> topologyById)
    {
        HashSet<string>? targeted = GraphEdgeInferenceHelpers.ParseTargetNodeIds(fromNode.Properties, propertyKey);

        if (targeted is null || targeted.Count == 0)
            return;

        foreach (string targetId in targeted)
        {
            GraphNode? targetNode = ResolveTopologyNode(topologyById, targetId);
            if (targetNode is null)
                continue;

            edges.Add(GraphEdgeInferenceHelpers.CreateEdge(
                fromNode.NodeId,
                targetNode.NodeId,
                edgeType,
                label,
                WeightTopologyRelationship,
                inferenceSource));
        }
    }

    private static Dictionary<string, GraphNode> BuildTopologyLookup(IReadOnlyList<GraphNode> topologyNodes) =>
        topologyNodes
            .GroupBy(static node => NormalizeTopologyNodeId(node.NodeId), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(static group => group.Key, static group => group.First(), StringComparer.OrdinalIgnoreCase);

    private static GraphNode? ResolveTopologyNode(
        Dictionary<string, GraphNode> topologyById,
        string targetNodeId) =>
        topologyById.GetValueOrDefault(NormalizeTopologyNodeId(targetNodeId));

    private static string NormalizeTopologyNodeId(string nodeId) => nodeId.Trim();
}
