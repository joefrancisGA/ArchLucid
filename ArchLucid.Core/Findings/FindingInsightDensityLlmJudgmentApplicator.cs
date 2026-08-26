using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings;

/// <summary>Applies Premium LLM judgment onto contract finding models.</summary>
public static class FindingInsightDensityLlmJudgmentApplicator
{
    public static void ApplyToArchitectureFinding(
        ArchitectureFinding finding,
        InsightDensityLlmJudgment judgment)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(judgment);

        finding.WhyThisIsNotGeneric = judgment.WhyThisIsNotGeneric;
        finding.PrincipalArchitectValue = judgment.PrincipalArchitectValue;
        finding.DecisionConsequence = judgment.DecisionConsequence;
        finding.InsightDensityScore = RefineScore(finding.InsightDensityScore, judgment.InsightDensityScore);

        if (ShouldDemote(judgment))
        {
            finding.Treatment = FindingTreatment.DemoteToChecklist;
            finding.Classification = FindingClassification.ChecklistCoverage;
        }
    }

    public static void ApplyToFinding(Finding finding, InsightDensityLlmJudgment judgment)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(judgment);

        finding.WhyThisIsNotGeneric = judgment.WhyThisIsNotGeneric;
        finding.PrincipalArchitectValue = judgment.PrincipalArchitectValue;
        finding.DecisionConsequence = judgment.DecisionConsequence;
        finding.InsightDensityScore = RefineScore(finding.InsightDensityScore, judgment.InsightDensityScore);

        if (ShouldDemote(judgment))
        {
            finding.Treatment = FindingTreatment.DemoteToChecklist;
            finding.Classification = FindingClassification.ChecklistCoverage;
        }
    }

    /// <summary>
    ///     Applies enrichment fields only — typed-engine-protected findings must not be demoted by judge output.
    /// </summary>
    public static void ApplyEnrichmentToFinding(Finding finding, InsightDensityLlmJudgment judgment)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(judgment);

        finding.WhyThisIsNotGeneric = judgment.WhyThisIsNotGeneric;
        finding.PrincipalArchitectValue = judgment.PrincipalArchitectValue;
        finding.DecisionConsequence = judgment.DecisionConsequence;
        finding.InsightDensityScore = RefineScore(finding.InsightDensityScore, judgment.InsightDensityScore);
    }

    private static int RefineScore(int? existingScore, int llmScore)
    {
        int clampedLlmScore = Math.Clamp(llmScore, 0, 100);

        if (existingScore is not { } existing)
        {
            return clampedLlmScore;
        }

        return Math.Clamp((existing + clampedLlmScore) / 2, 0, 100);
    }

    private static bool ShouldDemote(InsightDensityLlmJudgment judgment)
    {
        if (judgment.DemoteToChecklist)
        {
            return true;
        }

        return string.IsNullOrWhiteSpace(judgment.DecisionConsequence);
    }
}
