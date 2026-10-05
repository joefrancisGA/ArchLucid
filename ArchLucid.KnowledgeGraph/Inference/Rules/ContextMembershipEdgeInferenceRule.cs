using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Inference.Rules;

internal sealed class ContextMembershipEdgeInferenceRule : IGraphEdgeInferenceRule
{
    private const double WeightContextContains = 0.55d;

    public void InferEdges(GraphEdgeInferenceContext context, List<GraphEdge> edges)
    {
        edges.AddRange(context.Nodes
            .Where(x => !string.Equals(x.NodeType, GraphNodeTypes.ContextSnapshot, StringComparison.OrdinalIgnoreCase))
            .Select(node =>
            GraphEdgeInferenceHelpers.CreateEdge(
                context.ContextNodeId,
                node.NodeId,
                GraphEdgeTypes.Contains,
                "contains",
                WeightContextContains,
                GraphEdgeInferenceSources.ContextMembership)));
    }
}
