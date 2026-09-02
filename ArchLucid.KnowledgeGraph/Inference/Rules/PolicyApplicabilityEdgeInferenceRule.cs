using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Inference.Rules;

internal sealed class PolicyApplicabilityEdgeInferenceRule : IGraphEdgeInferenceRule
{
    private const double WeightPolicyTargeted = 1d;
    private const double WeightPolicySingleTopology = 0.55d;

    public void InferEdges(GraphEdgeInferenceContext context, List<GraphEdge> edges)
    {
        foreach (GraphNode policy in context.PolicyNodes)
        {
            HashSet<string>? targeted =
                GraphEdgeInferenceHelpers.ParseTargetNodeIds(policy.Properties, CanonicalGraphPropertyKeys.ApplicableTopologyNodeIds);
            if (targeted is not null && targeted.Count > 0)
            {
                foreach (GraphNode resource in context.TopologyNodes)
                {
                    if (!targeted.Contains(resource.NodeId))
                        continue;

                    edges.Add(GraphEdgeInferenceHelpers.CreateEdge(
                        policy.NodeId,
                        resource.NodeId,
                        GraphEdgeTypes.AppliesTo,
                        "applies to",
                        WeightPolicyTargeted,
                        GraphEdgeInferenceSources.PolicyTargeted));
                }

                continue;
            }

            if (context.TopologyNodes.Count != 1)
                continue;

            GraphNode soleTopology = context.TopologyNodes[0];
            edges.Add(GraphEdgeInferenceHelpers.CreateEdge(
                policy.NodeId,
                soleTopology.NodeId,
                GraphEdgeTypes.AppliesTo,
                "applies to",
                WeightPolicySingleTopology,
                GraphEdgeInferenceSources.PolicySingleTopologyFallback));
        }
    }
}
