using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Separates decision-grade review findings from basic hygiene checklist coverage (TB-384).
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter<FindingClassification>))]
public enum FindingClassification
{
    /// <summary>Governance-relevant, evidence-bound insight suitable for the Findings list.</summary>
    DecisionGradeFinding = 0,

    /// <summary>Basic hygiene or low-specificity observation routed to Checklist Coverage.</summary>
    ChecklistCoverage = 1,
}
