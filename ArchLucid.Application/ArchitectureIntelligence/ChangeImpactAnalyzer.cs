using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ChangeImpactAnalyzer : IChangeImpactAnalyzer
{
    private const string GraphCompletenessCaveat =
        "Impact analysis is limited to elements linked in the knowledge model graph.";

    public ChangeImpactResult Analyze(
        ArchitectureKnowledgeModel model,
        ArchitectureRecommendation recommendation)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(recommendation);

        List<ChangeImpactItem> impactedItems = [];
        HashSet<string> visitedElementIds = new(StringComparer.Ordinal);

        foreach (ArchitectureModelElement element in model.Elements)
        {
            if (!IsPotentiallyImpacted(element, recommendation))
            {
                continue;
            }

            impactedItems.Add(new ChangeImpactItem
            {
                ElementId = element.ElementId,
                ImpactKind = element.Kind.ToString(),
                Description = $"Recommendation may affect {element.Name}.",
            });

            visitedElementIds.Add(element.ElementId);
        }

        foreach (ArchitectureModelElement element in model.Elements)
        {
            foreach (string relatedElementId in element.RelatedElementIds)
            {
                if (visitedElementIds.Contains(relatedElementId))
                {
                    continue;
                }

                ArchitectureModelElement? relatedElement = model.Elements
                    .FirstOrDefault(candidate => candidate.ElementId == relatedElementId);

                if (relatedElement is null)
                {
                    continue;
                }

                impactedItems.Add(new ChangeImpactItem
                {
                    ElementId = relatedElement.ElementId,
                    ImpactKind = relatedElement.Kind.ToString(),
                    Description = $"Related element {relatedElement.Name} may be indirectly impacted.",
                });

                visitedElementIds.Add(relatedElement.ElementId);
            }
        }

        bool requiresFullReReview = model.Elements.Any(element =>
            element.Kind is ArchitectureElementKind.TrustBoundary
                or ArchitectureElementKind.DeploymentTopology
                or ArchitectureElementKind.ComplianceObligation)
            || recommendation.ProposedChange.Contains("trust boundary", StringComparison.OrdinalIgnoreCase)
            || recommendation.ProposedChange.Contains("deployment", StringComparison.OrdinalIgnoreCase)
            || recommendation.ProposedChange.Contains("compliance", StringComparison.OrdinalIgnoreCase);

        return new ChangeImpactResult
        {
            RecommendationId = recommendation.RecommendationId,
            ImpactedItems = impactedItems,
            GraphCompletenessCaveat = GraphCompletenessCaveat,
            RequiresFullReReview = requiresFullReReview,
        };
    }

    private static bool IsPotentiallyImpacted(
        ArchitectureModelElement element,
        ArchitectureRecommendation recommendation)
    {
        if (recommendation.AffectedRequirementOrQualityAttribute.Contains(element.Kind.ToString(), StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (recommendation.ProposedChange.Contains(element.Name, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return element.Kind is ArchitectureElementKind.TrustBoundary
            or ArchitectureElementKind.DeploymentTopology
            or ArchitectureElementKind.ComplianceObligation;
    }
}
