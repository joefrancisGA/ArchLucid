using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph.Inference.Rules;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Inference;

public class DefaultGraphEdgeInferer : IGraphEdgeInferer
{
    private static readonly IGraphEdgeInferenceRule[] Rules =
    [
        new ContextMembershipEdgeInferenceRule(),
        new ExplicitParentChildContainmentEdgeInferenceRule(),
        new HeuristicNetworkSubnetEdgeInferenceRule(),
        new TopologyRelationshipEdgeInferenceRule(),
        new SecurityProtectionEdgeInferenceRule(),
        new PolicyApplicabilityEdgeInferenceRule(),
        new RequirementRelevanceEdgeInferenceRule(),
    ];

    public IReadOnlyList<GraphEdge> InferEdges(
        ContextSnapshot contextSnapshot,
        IReadOnlyList<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(contextSnapshot);
        ArgumentNullException.ThrowIfNull(nodes);

        List<GraphEdge> edges = [];
        string contextNodeId = $"context-{contextSnapshot.SnapshotId:N}";

        GraphEdgeInferenceContext context = new()
        {
            ContextSnapshot = contextSnapshot,
            Nodes = nodes,
            ContextNodeId = contextNodeId,
            TopologyNodes = nodes
                .Where(x => string.Equals(x.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase))
                .ToList(),
            SecurityNodes = nodes
                .Where(x => string.Equals(x.NodeType, GraphNodeTypes.SecurityBaseline, StringComparison.OrdinalIgnoreCase))
                .ToList(),
            PolicyNodes = nodes
                .Where(x => string.Equals(x.NodeType, GraphNodeTypes.PolicyControl, StringComparison.OrdinalIgnoreCase))
                .ToList(),
            RequirementNodes = nodes
                .Where(x => string.Equals(x.NodeType, GraphNodeTypes.Requirement, StringComparison.OrdinalIgnoreCase))
                .ToList(),
            NodeById = nodes
                .GroupBy(static node => node.NodeId.Trim(), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(static group => group.Key, static group => group.First(), StringComparer.OrdinalIgnoreCase),
        };

        foreach (IGraphEdgeInferenceRule rule in Rules)
            rule.InferEdges(context, edges);

        return GraphEdgeInferenceHelpers.Deduplicate(edges);
    }
}
