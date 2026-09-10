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

            if (!context.NodeById.TryGetValue(parentId, out GraphNode? parentNode))
                continue;

            edges.Add(GraphEdgeInferenceHelpers.CreateEdge(
                parentNode.NodeId,
                node.NodeId,
                GraphEdgeTypes.ContainsResource,
                "contains resource",
                WeightExplicitParentChild,
                GraphEdgeInferenceSources.ExplicitParentChild));
        }
    }
}
