using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Heuristic privacy and compliance specialist (TB-2338 item 38).</summary>
public sealed class SpecialistReviewPrivacyComplianceRules
{
    public SpecialistReviewFinding Review(ArchitectureKnowledgeModel model, List<string> openQuestions)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(openQuestions);

        string searchText = SpecialistReviewModelTextSignals.CollectSearchText(model);

        if (!SpecialistReviewModelTextSignals.ContainsComplianceSignal(searchText))
        {
            return SpecialistReviewFindingFactory.CreatePassFinding(
                model,
                QualityDimension.PrivacyCompliance,
                "No explicit compliance jurisdiction signals detected",
                "Privacy review did not find GDPR, HIPAA, PCI, or residency language requiring compliance obligations.");
        }

        bool hasObligation = model.Elements.Any(
            element => element.Kind == ArchitectureElementKind.ComplianceObligation);

        if (!hasObligation)
        {
            openQuestions.Add("Which compliance obligations and jurisdictions apply to this architecture?");

            return SpecialistReviewFindingFactory.CreateIndeterminateFinding(
                model,
                QualityDimension.PrivacyCompliance,
                "Compliance signals without documented obligations",
                "Compliance or jurisdiction language appears in the model, but no ComplianceObligation element records applicable controls.");
        }

        ArchitectureModelElement? obligation = model.Elements.First(
            element => element.Kind == ArchitectureElementKind.ComplianceObligation);

        return SpecialistReviewFindingFactory.CreatePassFinding(
            model,
            QualityDimension.PrivacyCompliance,
            "Compliance obligations are documented",
            "Compliance obligation elements are present alongside jurisdiction or regulatory signals.",
            obligation);
    }
}
