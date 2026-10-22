using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Heuristic integration specialist (TB-2338 item 38).</summary>
public sealed class SpecialistReviewIntegrationRules
{
    public SpecialistReviewFinding Review(ArchitectureKnowledgeModel model, List<string> openQuestions)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(openQuestions);

        string searchText = SpecialistReviewModelTextSignals.CollectSearchText(model);

        if (!SpecialistReviewModelTextSignals.ContainsExternalIntegrationSignal(searchText))
        {
            return SpecialistReviewFindingFactory.CreatePassFinding(
                model,
                QualityDimension.Integration,
                "No external integration signals detected",
                "Integration review did not find third-party or external API dependencies requiring interface documentation.");
        }

        bool hasExternalInterface = model.Elements.Any(
            element => element.Kind == ArchitectureElementKind.Interface
                && (element.Name.Contains("external", StringComparison.OrdinalIgnoreCase)
                    || element.Name.Contains("third", StringComparison.OrdinalIgnoreCase)
                    || element.Name.Contains("vendor", StringComparison.OrdinalIgnoreCase)
                    || (element.Description?.Contains("external", StringComparison.OrdinalIgnoreCase) ?? false)));

        if (!hasExternalInterface)
        {
            openQuestions.Add("Which external APIs or SaaS integrations are in scope, and how are they authenticated?");

            return SpecialistReviewFindingFactory.CreateIndeterminateFinding(
                model,
                QualityDimension.Integration,
                "External dependencies mentioned without interface documentation",
                "Third-party or external API language appears in the model, but no Interface element documents those dependencies.");
        }

        ArchitectureModelElement? interfaceElement = model.Elements.First(
            element => element.Kind == ArchitectureElementKind.Interface
                && (element.Name.Contains("external", StringComparison.OrdinalIgnoreCase)
                    || element.Name.Contains("third", StringComparison.OrdinalIgnoreCase)
                    || element.Name.Contains("vendor", StringComparison.OrdinalIgnoreCase)
                    || (element.Description?.Contains("external", StringComparison.OrdinalIgnoreCase) ?? false)));

        return SpecialistReviewFindingFactory.CreatePassFinding(
            model,
            QualityDimension.Integration,
            "External integrations are documented as interfaces",
            "Interface elements document external or vendor dependencies referenced in the architecture model.",
            interfaceElement);
    }
}
