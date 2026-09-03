using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

partial class GraphCoverageAnalyzer
{
    public RequirementCoverageResult AnalyzeRequirements(GraphSnapshot graphSnapshot)
    {
        IReadOnlyList<GraphNode> requirementNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.Requirement);
        IReadOnlyList<GraphEdge> relatesToEdges = graphSnapshot.Edges
            .Where(x =>
                string.Equals(x.EdgeType, GraphEdgeTypes.RelatesTo, StringComparison.OrdinalIgnoreCase) &&
                x.Weight >= GraphEdgeDecisioningThresholds.MinWeightForSemanticLink)
            .ToList();

        HashSet<string> coveredIds = relatesToEdges
            .Select(x => x.FromNodeId)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        List<string> coveredRequirements = requirementNodes
            .Where(x => coveredIds.Contains(x.NodeId))
            .Select(x => x.Label)
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        List<string> uncoveredRequirements = requirementNodes
            .Where(x => !coveredIds.Contains(x.NodeId))
            .Select(x => x.Label)
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return new RequirementCoverageResult
        {
            RequirementNodeCount = requirementNodes.Count,
            RelatedRequirementCount = coveredRequirements.Count,
            UnrelatedRequirementCount = uncoveredRequirements.Count,
            CoveredRequirements = coveredRequirements,
            UncoveredRequirements = uncoveredRequirements
        };
    }

    public RequirementExpectationResult AnalyzeRequirementExpectations(GraphSnapshot graphSnapshot)
    {
        IReadOnlyList<GraphNode> requirementNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.Requirement);
        IReadOnlyList<GraphNode> topologyNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource);
        IReadOnlyList<string> expectedThemes =
            WorkloadConditionedRequirementExpectationResolver.ResolveExpectedThemes(graphSnapshot);

        HashSet<string> presentThemes = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode requirement in requirementNodes)
        {
            string theme = WorkloadConditionedRequirementExpectationResolver.ResolveRequirementTheme(requirement);

            if (!string.Equals(theme, "general", StringComparison.OrdinalIgnoreCase))
                presentThemes.Add(theme);
        }

        List<string> missingThemes = expectedThemes
            .Where(theme => !presentThemes.Contains(theme))
            .ToList();

        return new RequirementExpectationResult
        {
            RequirementNodeCount = requirementNodes.Count,
            TopologyNodeCount = topologyNodes.Count,
            ExpectedThemes = [.. expectedThemes],
            PresentThemes = presentThemes.OrderBy(static t => t, StringComparer.OrdinalIgnoreCase).ToList(),
            MissingThemes = missingThemes
        };
    }
}
