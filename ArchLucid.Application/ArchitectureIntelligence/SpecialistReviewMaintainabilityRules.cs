using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Heuristic maintainability specialist (TB-2338 item 38).</summary>
public sealed class SpecialistReviewMaintainabilityRules
{
    public SpecialistReviewFinding Review(ArchitectureKnowledgeModel model, List<string> openQuestions)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(openQuestions);

        int componentCount = model.Elements.Count(
            element => element.Kind == ArchitectureElementKind.Component);
        bool hasDecision = model.Elements.Any(element => element.Kind == ArchitectureElementKind.Decision);

        if (componentCount < 2)
        {
            return SpecialistReviewFindingFactory.CreatePassFinding(
                model,
                QualityDimension.Maintainability,
                "Small component surface for maintainability review",
                "Maintainability review found a single primary component; explicit decision records are optional at this scale.");
        }

        if (!hasDecision)
        {
            openQuestions.Add("Which architecture decisions should be recorded for future maintainers?");

            return SpecialistReviewFindingFactory.CreateIndeterminateFinding(
                model,
                QualityDimension.Maintainability,
                "Multiple components without recorded decisions",
                "Several components are modeled, but no Decision element captures rationale for structural choices.");
        }

        ArchitectureModelElement? decision = model.Elements.First(
            element => element.Kind == ArchitectureElementKind.Decision);

        return SpecialistReviewFindingFactory.CreatePassFinding(
            model,
            QualityDimension.Maintainability,
            "Architecture decisions are recorded for multi-component design",
            "Decision elements document rationale alongside multiple components in the model.",
            decision);
    }
}
