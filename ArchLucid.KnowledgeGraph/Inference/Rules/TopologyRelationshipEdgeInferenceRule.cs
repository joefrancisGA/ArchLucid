using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Inference.Rules;

internal sealed class TopologyRelationshipEdgeInferenceRule : IGraphEdgeInferenceRule
{
    private const double WeightTopologyRelationship = 1d;

    public void InferEdges(GraphEdgeInferenceContext context, List<GraphEdge> edges)
    {
        Dictionary<string, GraphNode> topologyById = context.TopologyNodes.ToDictionary(n => n.NodeId, StringComparer.OrdinalIgnoreCase);

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
                    if (!topologyById.ContainsKey(targetId))
                        continue;

                    edges.Add(GraphEdgeInferenceHelpers.CreateEdge(
                        node.NodeId,
                        targetId,
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
            if (!topologyById.ContainsKey(targetId))
                continue;

            edges.Add(GraphEdgeInferenceHelpers.CreateEdge(
                fromNode.NodeId,
                targetId,
                edgeType,
                label,
                WeightTopologyRelationship,
                inferenceSource));
        }
    }
}
