namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Separates decision-grade review findings from basic hygiene checklist coverage (TB-384).
/// </summary>
public enum FindingClassification
{
    /// <summary>Governance-relevant, evidence-bound insight suitable for the Findings list.</summary>
    DecisionGradeFinding = 0,

    /// <summary>Basic hygiene or low-specificity observation routed to Checklist Coverage.</summary>
    ChecklistCoverage = 1,
}
