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
                .Where(static node => NodeTypeEquals(node.NodeType, GraphNodeTypes.TopologyResource))
                .ToList(),
            SecurityNodes = nodes
                .Where(static node => NodeTypeEquals(node.NodeType, GraphNodeTypes.SecurityBaseline))
                .ToList(),
            PolicyNodes = nodes
                .Where(static node => NodeTypeEquals(node.NodeType, GraphNodeTypes.PolicyControl))
                .ToList(),
            RequirementNodes = nodes
                .Where(static node => NodeTypeEquals(node.NodeType, GraphNodeTypes.Requirement))
                .ToList(),
            NodeById = nodes
                .GroupBy(static node => node.NodeId.Trim(), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(static group => group.Key, static group => group.First(), StringComparer.OrdinalIgnoreCase),
        };

        foreach (IGraphEdgeInferenceRule rule in Rules)
            rule.InferEdges(context, edges);

        return GraphEdgeInferenceHelpers.Deduplicate(edges);
    }

    private static bool NodeTypeEquals(string? actual, string expected) =>
        string.Equals((actual ?? string.Empty).Trim(), expected, StringComparison.OrdinalIgnoreCase);
}
