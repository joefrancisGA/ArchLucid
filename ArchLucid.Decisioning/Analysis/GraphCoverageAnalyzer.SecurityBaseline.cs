using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

partial class GraphCoverageAnalyzer
{
    public SecurityBaselineCategoryExpectationResult AnalyzeSecurityBaselineExpectations(GraphSnapshot graphSnapshot)
    {
        IReadOnlyList<GraphNode> securityNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.SecurityBaseline);
        IReadOnlyList<GraphNode> topologyNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource);
        IReadOnlyList<string> expectedCategories =
            TopologyExpectedCategoryResolver.ResolveExpectedCategories(graphSnapshot);

        HashSet<string> protectedTopologyIds = graphSnapshot.Edges
            .Where(x =>
                string.Equals(x.EdgeType, GraphEdgeTypes.Protects, StringComparison.OrdinalIgnoreCase)
                && x.Weight >= GraphEdgeDecisioningThresholds.MinWeightForSemanticLink)
            .Select(static x => x.ToNodeId)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        HashSet<string> protectedCategories = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode topologyNode in topologyNodes)
        {
            if (!protectedTopologyIds.Contains(topologyNode.NodeId))
                continue;

            if (!string.IsNullOrWhiteSpace(topologyNode.Category))
                protectedCategories.Add(topologyNode.Category);
        }

        List<string> missingCategories = expectedCategories
            .Where(category => !protectedCategories.Contains(category))
            .ToList();

        return new SecurityBaselineCategoryExpectationResult
        {
            TopologyNodeCount = topologyNodes.Count,
            SecurityNodeCount = securityNodes.Count,
            ExpectedCategories = [.. expectedCategories],
            ProtectedCategories = protectedCategories.OrderBy(static c => c, StringComparer.OrdinalIgnoreCase).ToList(),
            MissingCategories = missingCategories
        };
    }

    public SecurityBaselineCompletenessResult AnalyzeSecurityBaselineCompleteness(GraphSnapshot graphSnapshot)
    {
        IReadOnlyList<GraphNode> securityNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.SecurityBaseline);
        IReadOnlyList<GraphNode> topologyNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource);
        IReadOnlyList<string> expectedFamilies =
            WorkloadConditionedSecurityControlFamilyResolver.ResolveExpectedControlFamilies(graphSnapshot);

        HashSet<string> presentFamilies = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode securityNode in securityNodes)
        {
            securityNode.Properties.TryGetValue("status", out string? status);

            if (string.Equals(status, "missing", StringComparison.OrdinalIgnoreCase))
                continue;

            bool protectsTopology = graphSnapshot
                .GetOutgoingTargets(
                    securityNode.NodeId,
                    GraphEdgeTypes.Protects,
                    GraphEdgeDecisioningThresholds.MinWeightForSemanticLink)
                .Any(n => string.Equals(n.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase));

            if (!protectsTopology)
                continue;

            string family = WorkloadConditionedSecurityControlFamilyResolver.ResolveControlFamily(securityNode);

            if (!string.Equals(family, "general", StringComparison.OrdinalIgnoreCase))
                presentFamilies.Add(family);
        }

        List<string> missingFamilies = expectedFamilies
            .Where(family => !presentFamilies.Contains(family))
            .ToList();

        HashSet<string> allFamilies = new(expectedFamilies, StringComparer.OrdinalIgnoreCase);

        foreach (string present in presentFamilies)
            allFamilies.Add(present);

        List<SecurityBaselineCompletenessMatrixRow> matrix = allFamilies
            .OrderBy(static f => f, StringComparer.OrdinalIgnoreCase)
            .Select(family => new SecurityBaselineCompletenessMatrixRow
            {
                ControlFamily = family,
                Expected = expectedFamilies.Contains(family, StringComparer.OrdinalIgnoreCase),
                Present = presentFamilies.Contains(family)
            })
            .ToList();

        return new SecurityBaselineCompletenessResult
        {
            TopologyNodeCount = topologyNodes.Count,
            SecurityNodeCount = securityNodes.Count,
            ExpectedControlFamilies = [.. expectedFamilies],
            PresentControlFamilies = presentFamilies.OrderBy(static f => f, StringComparer.OrdinalIgnoreCase).ToList(),
            MissingControlFamilies = missingFamilies,
            CompletenessMatrix = matrix
        };
    }
}
