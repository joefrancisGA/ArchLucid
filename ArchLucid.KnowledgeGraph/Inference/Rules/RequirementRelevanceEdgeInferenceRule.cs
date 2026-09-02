using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Inference.Rules;

internal sealed class RequirementRelevanceEdgeInferenceRule : IGraphEdgeInferenceRule
{
    private const double WeightRequirementTargeted = 1d;
    private const double WeightRequirementSingleTopology = 0.55d;

    public void InferEdges(GraphEdgeInferenceContext context, List<GraphEdge> edges)
    {
        foreach (GraphNode requirement in context.RequirementNodes)
        {
            HashSet<string>? targeted = GraphEdgeInferenceHelpers.ParseTargetNodeIds(requirement.Properties,
                CanonicalGraphPropertyKeys.RelatedTopologyNodeIds);
            if (targeted is not null && targeted.Count > 0)
            {
                foreach (GraphNode resource in context.TopologyNodes)
                {
                    if (!targeted.Contains(resource.NodeId))
                        continue;

                    edges.Add(GraphEdgeInferenceHelpers.CreateEdge(
                        requirement.NodeId,
                        resource.NodeId,
                        GraphEdgeTypes.RelatesTo,
                        "relates to",
                        WeightRequirementTargeted,
                        GraphEdgeInferenceSources.RequirementTargeted));
                }

                continue;
            }

            if (context.TopologyNodes.Count != 1)
                continue;

            GraphNode soleTopology = context.TopologyNodes[0];
            edges.Add(GraphEdgeInferenceHelpers.CreateEdge(
                requirement.NodeId,
                soleTopology.NodeId,
                GraphEdgeTypes.RelatesTo,
                "relates to",
                WeightRequirementSingleTopology,
                GraphEdgeInferenceSources.RequirementSingleTopologyFallback));
        }
    }
}
