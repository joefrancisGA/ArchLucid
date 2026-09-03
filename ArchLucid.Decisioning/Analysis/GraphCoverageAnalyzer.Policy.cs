using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

partial class GraphCoverageAnalyzer
{
    public PolicyCoverageResult AnalyzePolicy(GraphSnapshot graphSnapshot)
    {
        IReadOnlyList<GraphNode> policyNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.PolicyControl);
        IReadOnlyList<GraphNode> topologyNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource);
        IReadOnlyList<GraphEdge> appliesToEdges = graphSnapshot.Edges
            .Where(x =>
                string.Equals(x.EdgeType, GraphEdgeTypes.AppliesTo, StringComparison.OrdinalIgnoreCase) &&
                x.Weight >= GraphEdgeDecisioningThresholds.MinWeightForSemanticLink)
            .ToList();

        HashSet<string> coveredIds = appliesToEdges
            .Select(x => x.ToNodeId)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        List<string> uncoveredResources = topologyNodes
            .Where(x => !coveredIds.Contains(x.NodeId))
            .Select(x => x.Label)
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return new PolicyCoverageResult
        {
            PolicyNodeCount = policyNodes.Count,
            PolicyApplicabilityEdgeCount = appliesToEdges.Count,
            Policies = policyNodes.Select(x => x.Label).Distinct(StringComparer.OrdinalIgnoreCase).ToList(),
            UncoveredResources = uncoveredResources
        };
    }
}
