using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

partial class GraphCoverageAnalyzer
{
    public SecurityCoverageResult AnalyzeSecurity(GraphSnapshot graphSnapshot)
    {
        IReadOnlyList<GraphNode> securityNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.SecurityBaseline);
        IReadOnlyList<GraphNode> topologyNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource);
        IReadOnlyList<GraphEdge> protectsEdges = graphSnapshot.Edges
            .Where(x =>
                string.Equals(x.EdgeType, GraphEdgeTypes.Protects, StringComparison.OrdinalIgnoreCase) &&
                x.Weight >= GraphEdgeDecisioningThresholds.MinWeightForSemanticLink)
            .ToList();

        HashSet<string> protectedIds = protectsEdges
            .Select(x => x.ToNodeId)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        List<string> protectedResources = topologyNodes
            .Where(x => protectedIds.Contains(x.NodeId))
            .Select(x => x.Label)
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        List<string> unprotectedResources = topologyNodes
            .Where(x => !protectedIds.Contains(x.NodeId))
            .Select(x => x.Label)
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return new SecurityCoverageResult
        {
            SecurityNodeCount = securityNodes.Count,
            ProtectedResourceCount = protectedResources.Count,
            UnprotectedResourceCount = unprotectedResources.Count,
            ProtectedResources = protectedResources,
            UnprotectedResources = unprotectedResources
        };
    }
}
