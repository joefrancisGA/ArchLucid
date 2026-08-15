using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Heuristic AI-specific risk specialist (TB-2338 item 38).</summary>
public sealed class SpecialistReviewAiSpecificRiskRules
{
    public SpecialistReviewFinding Review(ArchitectureKnowledgeModel model, List<string> openQuestions)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(openQuestions);

        string searchText = SpecialistReviewModelTextSignals.CollectSearchText(model);

        if (!SpecialistReviewModelTextSignals.ContainsAiSignal(searchText))
        {
            return SpecialistReviewFindingFactory.CreatePassFinding(
                model,
                QualityDimension.AiSpecificRisk,
                "No AI or LLM usage signals detected",
                "AI risk review did not find generative AI or model inference references requiring governance.");
        }

        bool hasAiGovernance = model.Elements.Any(IsAiGovernanceElement);

        if (!hasAiGovernance)
        {
            openQuestions.Add("What AI governance controls apply to model usage, data handling, and human oversight?");

            return SpecialistReviewFindingFactory.CreateIndeterminateFinding(
                model,
                QualityDimension.AiSpecificRisk,
                "AI usage signals without documented governance",
                "AI or LLM references appear in the model, but no Risk or ComplianceObligation element addresses AI-specific controls.");
        }

        ArchitectureModelElement? governanceElement = model.Elements.First(IsAiGovernanceElement);

        return SpecialistReviewFindingFactory.CreatePassFinding(
            model,
            QualityDimension.AiSpecificRisk,
            "AI governance signals are documented",
            "Risk or compliance elements reference AI or LLM usage alongside model inference signals.",
            governanceElement);
    }

    private static bool IsAiGovernanceElement(ArchitectureModelElement element)
    {
        if (element.Kind is not ArchitectureElementKind.Risk
            and not ArchitectureElementKind.ComplianceObligation)
        {
            return false;
        }

        return element.Name.Contains("ai", StringComparison.OrdinalIgnoreCase)
            || (element.Description?.Contains("ai", StringComparison.OrdinalIgnoreCase) ?? false)
            || element.Name.Contains("llm", StringComparison.OrdinalIgnoreCase)
            || (element.Description?.Contains("llm", StringComparison.OrdinalIgnoreCase) ?? false);
    }
}
