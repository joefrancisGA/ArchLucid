using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Inference.Rules;

internal sealed class ExplicitParentChildContainmentEdgeInferenceRule : IGraphEdgeInferenceRule
{
    private const double WeightExplicitParentChild = 1d;

    public void InferEdges(GraphEdgeInferenceContext context, List<GraphEdge> edges)
    {
        foreach (GraphNode node in context.Nodes)
        {
            if (!GraphNodePropertyReader.TryGetPropertyValue(node.Properties, "parentNodeId", out string? parentId))
                continue;

            if (string.IsNullOrWhiteSpace(parentId))
                continue;

            if (!context.NodeById.ContainsKey(parentId))
                continue;

            edges.Add(GraphEdgeInferenceHelpers.CreateEdge(
                parentId,
                node.NodeId,
                GraphEdgeTypes.ContainsResource,
                "contains resource",
                WeightExplicitParentChild,
                GraphEdgeInferenceSources.ExplicitParentChild));
        }
    }
}
