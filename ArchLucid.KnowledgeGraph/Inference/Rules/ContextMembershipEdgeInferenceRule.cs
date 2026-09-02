using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Inference.Rules;

internal sealed class ContextMembershipEdgeInferenceRule : IGraphEdgeInferenceRule
{
    private const double WeightContextContains = 0.55d;

    public void InferEdges(GraphEdgeInferenceContext context, List<GraphEdge> edges)
    {
        edges.AddRange(context.Nodes.Where(x => x.NodeType != GraphNodeTypes.ContextSnapshot).Select(node =>
            GraphEdgeInferenceHelpers.CreateEdge(
                context.ContextNodeId,
                node.NodeId,
                GraphEdgeTypes.Contains,
                "contains",
                WeightContextContains,
                GraphEdgeInferenceSources.ContextMembership)));
    }
}
