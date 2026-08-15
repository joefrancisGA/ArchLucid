using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Links specialist findings to requirements, decisions, and components (TB-2339 item 44).</summary>
internal static class SpecialistReviewFindingTraceBuilder
{
    internal static void ApplyTrace(
        SpecialistReviewFinding finding,
        ArchitectureKnowledgeModel model,
        ArchitectureModelElement? supportingElement)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(model);

        if (supportingElement is not null)
        {
            finding.LifecycleScope = supportingElement.LifecycleScope;
            finding.RelatedModelElementIds.Add(supportingElement.ElementId);

            foreach (string relatedId in supportingElement.RelatedElementIds)
            {
                if (!string.IsNullOrWhiteSpace(relatedId))
                {
                    finding.RelatedModelElementIds.Add(relatedId);
                }
            }
        }

        foreach (ArchitectureModelElement element in model.Elements)
        {
            if (element.Kind == ArchitectureElementKind.FunctionalRequirement)
            {
                finding.RelatedRequirementElementIds.Add(element.ElementId);
            }

            if (element.Kind == ArchitectureElementKind.Decision)
            {
                finding.RelatedDecisionElementIds.Add(element.ElementId);
            }

            if (element.Kind == ArchitectureElementKind.Component)
            {
                finding.RelatedModelElementIds.Add(element.ElementId);
            }
        }

        finding.RelatedModelElementIds = finding.RelatedModelElementIds
            .Distinct(StringComparer.Ordinal)
            .Take(8)
            .ToList();
        finding.RelatedRequirementElementIds = finding.RelatedRequirementElementIds
            .Distinct(StringComparer.Ordinal)
            .Take(4)
            .ToList();
        finding.RelatedDecisionElementIds = finding.RelatedDecisionElementIds
            .Distinct(StringComparer.Ordinal)
            .Take(4)
            .ToList();
    }
}
