using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Heuristic data architecture specialist (TB-2338 item 38).</summary>
public sealed class SpecialistReviewDataArchitectureRules
{
    public SpecialistReviewFinding Review(ArchitectureKnowledgeModel model, List<string> openQuestions)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(openQuestions);

        string searchText = SpecialistReviewModelTextSignals.CollectSearchText(model);

        if (!SpecialistReviewModelTextSignals.ContainsSensitiveDataSignal(searchText))
        {
            return SpecialistReviewFindingFactory.CreatePassFinding(
                model,
                QualityDimension.DataArchitecture,
                "No sensitive data signals requiring data-flow mapping",
                "Data architecture review did not find PII or sensitive-data language requiring explicit data-flow documentation.");
        }

        bool hasDataFlow = model.Elements.Any(element => element.Kind == ArchitectureElementKind.DataFlow);

        if (!hasDataFlow)
        {
            openQuestions.Add("Which data flows carry sensitive or customer data, and where is it stored?");

            return SpecialistReviewFindingFactory.CreateFailFinding(
                model,
                QualityDimension.DataArchitecture,
                "Sensitive data mentioned without documented data flows",
                "Sensitive or customer data is referenced in the model, but no DataFlow element maps movement or storage.",
                severity: "High");
        }

        ArchitectureModelElement? dataFlow = model.Elements.First(
            element => element.Kind == ArchitectureElementKind.DataFlow);

        return SpecialistReviewFindingFactory.CreatePassFinding(
            model,
            QualityDimension.DataArchitecture,
            "Sensitive data references include data-flow documentation",
            "Data flows are documented alongside sensitive-data signals in the architecture model.",
            dataFlow);
    }
}
