using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Inference.Rules;

internal sealed class SecurityProtectionEdgeInferenceRule : IGraphEdgeInferenceRule
{
    private const double WeightSecurityTargeted = 1d;
    private const double WeightSecuritySingleTopology = 0.55d;

    public void InferEdges(GraphEdgeInferenceContext context, List<GraphEdge> edges)
    {
        foreach (GraphNode security in context.SecurityNodes)
        {
            HashSet<string>? targeted =
                GraphEdgeInferenceHelpers.ParseTargetNodeIds(security.Properties, CanonicalGraphPropertyKeys.ProtectedTopologyNodeIds);
            if (targeted is not null && targeted.Count > 0)
            {
                foreach (GraphNode resource in context.TopologyNodes)
                {
                    if (!targeted.Contains(resource.NodeId))
                        continue;

                    edges.Add(GraphEdgeInferenceHelpers.CreateEdge(
                        security.NodeId,
                        resource.NodeId,
                        GraphEdgeTypes.Protects,
                        "protects",
                        WeightSecurityTargeted,
                        GraphEdgeInferenceSources.SecurityTargeted));
                }

                continue;
            }

            if (context.TopologyNodes.Count != 1)
                continue;

            GraphNode soleTopology = context.TopologyNodes[0];
            edges.Add(GraphEdgeInferenceHelpers.CreateEdge(
                security.NodeId,
                soleTopology.NodeId,
                GraphEdgeTypes.Protects,
                "protects",
                WeightSecuritySingleTopology,
                GraphEdgeInferenceSources.SecuritySingleTopologyFallback));
        }
    }
}
