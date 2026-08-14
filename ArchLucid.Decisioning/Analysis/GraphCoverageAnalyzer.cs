using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

public class GraphCoverageAnalyzer : IGraphCoverageAnalyzer
{
    public TopologyCoverageResult AnalyzeTopology(GraphSnapshot graphSnapshot)
    {
        IReadOnlyList<GraphNode> topologyNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource);

        List<string> categories = topologyNodes
            .Select(x => x.Category ?? "general")
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        IReadOnlyList<string> expectedCategories = TopologyExpectedCategoryResolver.ResolveExpectedCategories(graphSnapshot);

        TopologyCoverageResult result = new()
        {
            HasNetwork =
                categories.Exists(x =>
                    x.Equals(GraphTopologyCategories.Network, StringComparison.OrdinalIgnoreCase)),
            HasCompute =
                categories.Exists(x =>
                    x.Equals(GraphTopologyCategories.Compute, StringComparison.OrdinalIgnoreCase)),
            HasStorage =
                categories.Exists(x =>
                    x.Equals(GraphTopologyCategories.Storage, StringComparison.OrdinalIgnoreCase)),
            HasData =
                categories.Exists(x => x.Equals(GraphTopologyCategories.Data, StringComparison.OrdinalIgnoreCase)),
            PresentCategories = categories,
            ExpectedCategories = [.. expectedCategories],
            TopologyNodeCount = topologyNodes.Count,
            TopologyNodeIds = topologyNodes.Select(n => n.NodeId).ToList()
        };

        foreach (string expected in expectedCategories)
        {
            if (categories.Exists(c => c.Equals(expected, StringComparison.OrdinalIgnoreCase)))
                continue;

            result.MissingCategories.Add(expected);
        }

        return result;
    }

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

