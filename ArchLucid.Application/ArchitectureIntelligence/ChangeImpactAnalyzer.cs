using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ChangeImpactAnalyzer : IChangeImpactAnalyzer
{
    private const string GraphCompletenessCaveat =
        "Impact analysis is limited to elements linked in the knowledge model graph. "
        + "Uncaptured dependencies may exist; do not treat this list as exhaustive.";

    public ChangeImpactResult Analyze(
        ArchitectureKnowledgeModel model,
        ArchitectureRecommendation recommendation)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(recommendation);

        return AnalyzeInternal(model, recommendation, diffEntries: null);
    }

    public ChangeImpactResult Analyze(
        ArchitectureModelDiff diff,
        ArchitectureRecommendation recommendation)
    {
        ArgumentNullException.ThrowIfNull(diff);
        ArgumentNullException.ThrowIfNull(recommendation);

        return AnalyzeInternal(diff.AfterModel, recommendation, diff.Entries);
    }

    private static ChangeImpactResult AnalyzeInternal(
        ArchitectureKnowledgeModel model,
        ArchitectureRecommendation recommendation,
        IReadOnlyList<ArchitectureModelDiffEntry>? diffEntries)
    {
        List<ChangeImpactItem> impactedItems = [];
        HashSet<string> visitedElementIds = new(StringComparer.Ordinal);

        if (diffEntries is not null)
        {
            foreach (ArchitectureModelDiffEntry entry in diffEntries)
            {
                impactedItems.Add(new ChangeImpactItem
                {
                    ElementId = entry.ElementId,
                    ImpactKind = entry.ElementKind.ToString(),
                    Description = $"{entry.ChangeKind}: {entry.Description}",
                    Category = ChangeImpactCategory.ModelDiffChange,
                });

                visitedElementIds.Add(entry.ElementId);
            }
        }

        foreach (ArchitectureModelElement element in model.Elements)
        {
            if (!IsPotentiallyImpacted(element, recommendation))
            {
                continue;
            }

            if (!visitedElementIds.Add(element.ElementId))
            {
                continue;
            }

            impactedItems.Add(new ChangeImpactItem
            {
                ElementId = element.ElementId,
                ImpactKind = element.Kind.ToString(),
                Description = $"Recommendation may affect {element.Name}.",
                Category = ChangeImpactCategoryMapper.FromElementKind(element.Kind),
            });
        }

        bool relatedExpansionAddedElements;

        do
        {
            relatedExpansionAddedElements = false;

            foreach (ArchitectureModelElement element in model.Elements)
            {
                if (!visitedElementIds.Contains(element.ElementId))
                {
                    continue;
                }

                foreach (string relatedElementId in element.RelatedElementIds)
                {
                    if (!visitedElementIds.Add(relatedElementId))
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
                        Category = ChangeImpactCategoryMapper.FromElementKind(relatedElement.Kind),
                    });
                    relatedExpansionAddedElements = true;
                }
            }

            foreach (ArchitectureModelElement element in model.Elements)
            {
                if (visitedElementIds.Contains(element.ElementId))
                {
                    continue;
                }

                if (!element.RelatedElementIds.Any(relatedElementId => visitedElementIds.Contains(relatedElementId)))
                {
                    continue;
                }

                if (!visitedElementIds.Add(element.ElementId))
                {
                    continue;
                }

                impactedItems.Add(new ChangeImpactItem
                {
                    ElementId = element.ElementId,
                    ImpactKind = element.Kind.ToString(),
                    Description = $"Related element {element.Name} may be indirectly impacted.",
                    Category = ChangeImpactCategoryMapper.FromElementKind(element.Kind),
                });
                relatedExpansionAddedElements = true;
            }
        }
        while (relatedExpansionAddedElements);

        bool requiresFullReReview = RequiresFullReReview(model, recommendation, diffEntries);

        return new ChangeImpactResult
        {
            RecommendationId = recommendation.RecommendationId,
            ImpactedItems = impactedItems,
            GraphCompletenessCaveat = GraphCompletenessCaveat,
            RequiresFullReReview = requiresFullReReview,
        };
    }

    private static bool RequiresFullReReview(
        ArchitectureKnowledgeModel model,
        ArchitectureRecommendation recommendation,
        IReadOnlyList<ArchitectureModelDiffEntry>? diffEntries)
    {
        if (diffEntries is not null
            && diffEntries.Any(entry => entry.ElementKind is ArchitectureElementKind.TrustBoundary
                or ArchitectureElementKind.DeploymentTopology
                or ArchitectureElementKind.ComplianceObligation
                or ArchitectureElementKind.DataFlow))
        {
            return true;
        }

        return model.Elements.Any(element =>
                element.Kind is ArchitectureElementKind.TrustBoundary
                    or ArchitectureElementKind.DeploymentTopology
                    or ArchitectureElementKind.ComplianceObligation)
            || recommendation.ProposedChange.Contains("trust boundary", StringComparison.OrdinalIgnoreCase)
            || recommendation.ProposedChange.Contains("deployment", StringComparison.OrdinalIgnoreCase)
            || recommendation.ProposedChange.Contains("compliance", StringComparison.OrdinalIgnoreCase)
            || recommendation.ProposedChange.Contains("jurisdiction", StringComparison.OrdinalIgnoreCase)
            || recommendation.ProposedChange.Contains("data classification", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPotentiallyImpacted(
        ArchitectureModelElement element,
        ArchitectureRecommendation recommendation)
    {
        if (recommendation.AffectedRequirementOrQualityAttribute.Contains(
                element.Kind.ToString(),
                StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (recommendation.ProposedChange.Contains(element.Name, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return element.Kind is ArchitectureElementKind.TrustBoundary
            or ArchitectureElementKind.DeploymentTopology
            or ArchitectureElementKind.ComplianceObligation
            or ArchitectureElementKind.Decision
            or ArchitectureElementKind.Risk;
    }
}
