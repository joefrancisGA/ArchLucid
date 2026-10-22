using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Deterministic structural requirement traceability checks over RELATES_TO edges and requirement text.
/// </summary>
public static class RequirementTraceabilityAnalyzer
{
    public static IReadOnlyList<RequirementTraceabilityGap> Analyze(GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        List<RequirementTraceabilityGap> gaps = [];
        IReadOnlyList<GraphNode> requirementNodes = graphSnapshot.GetNodesByType(GraphNodeTypes.Requirement);

        if (requirementNodes.Count == 0)
            return gaps;

        foreach (GraphNode requirement in requirementNodes)
        {
            List<GraphNode> relatedTopology = graphSnapshot
                .GetOutgoingTargets(
                    requirement.NodeId,
                    GraphEdgeTypes.RelatesTo,
                    GraphEdgeDecisioningThresholds.MinWeightForSemanticLink)
                .Where(n => string.Equals(n.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase))
                .ToList();

            if (relatedTopology.Count == 0)
            {
                gaps.Add(new RequirementTraceabilityGap
                {
                    GapCode = "requirement-without-topology-link",
                    Title = $"Requirement '{requirement.Label}' is not linked to topology resources",
                    Rationale = "No RELATES_TO edge connects this requirement to any TopologyResource node.",
                    Description = $"Requirement '{requirement.Label}' cannot be traced to architecture resources in the graph.",
                    Impact = "Reviewers cannot verify that this requirement is reflected in the scoped architecture.",
                    RelatedNodeIds = [requirement.NodeId]
                });
            }

            if (!requirement.Properties.TryGetValue("text", out string? text) || string.IsNullOrWhiteSpace(text))
            {
                gaps.Add(new RequirementTraceabilityGap
                {
                    GapCode = "requirement-without-text",
                    Title = $"Requirement '{requirement.Label}' has no requirement text",
                    Rationale = "The requirement node is missing non-empty text in graph properties.",
                    Description = $"Requirement '{requirement.Label}' cannot be reviewed without captured requirement text.",
                    Impact = "Decisioning cannot compare manifest outcomes against an explicit requirement statement.",
                    RelatedNodeIds = [requirement.NodeId]
                });
            }
        }

        IEnumerable<IGrouping<string, GraphNode>> duplicateLabels = requirementNodes
            .Where(n => !string.IsNullOrWhiteSpace(n.Label))
            .GroupBy(n => n.Label, StringComparer.OrdinalIgnoreCase)
            .Where(g => g.Count() > 1);

        foreach (IGrouping<string, GraphNode> group in duplicateLabels)
        {
            gaps.Add(new RequirementTraceabilityGap
            {
                GapCode = "duplicate-requirement-label",
                Title = $"Duplicate requirement label '{group.Key}'",
                Rationale = "Multiple requirement nodes share the same label, weakening traceability.",
                Description = $"Requirement label '{group.Key}' appears on {group.Count()} nodes.",
                Impact = "Manifest and review exports may reference ambiguous requirement identities.",
                RelatedNodeIds = group.Select(static n => n.NodeId).ToList()
            });
        }

        return gaps;
    }
}
