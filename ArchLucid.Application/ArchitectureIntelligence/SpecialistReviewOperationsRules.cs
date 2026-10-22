using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Heuristic operations specialist (TB-2338 item 38).</summary>
public sealed class SpecialistReviewOperationsRules
{
    public SpecialistReviewFinding Review(ArchitectureKnowledgeModel model, List<string> openQuestions)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(openQuestions);

        bool hasOwnership = model.Elements.Any(
            element => element.Kind == ArchitectureElementKind.OperationalOwnership);
        string searchText = SpecialistReviewModelTextSignals.CollectSearchText(model);
        bool hasOperationsText = SpecialistReviewModelTextSignals.ContainsOperationsSignal(searchText);

        if (hasOwnership || hasOperationsText)
        {
            ArchitectureModelElement? ownershipElement = model.Elements.FirstOrDefault(
                element => element.Kind == ArchitectureElementKind.OperationalOwnership);

            return SpecialistReviewFindingFactory.CreatePassFinding(
                model,
                QualityDimension.Operations,
                "Operational ownership or runbook signals are documented",
                hasOwnership
                    ? "An operational ownership element is present in the architecture model."
                    : "Monitoring, alerting, or runbook references appear in the documented architecture.",
                ownershipElement);
        }

        openQuestions.Add("Who owns on-call, monitoring, and incident response for this architecture?");

        return SpecialistReviewFindingFactory.CreateIndeterminateFinding(
            model,
            QualityDimension.Operations,
            "Operational ownership is not documented",
            "No operational ownership element or runbook/monitoring signals were found in the model.");
    }
}
