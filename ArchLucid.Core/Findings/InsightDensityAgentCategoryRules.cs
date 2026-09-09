namespace ArchLucid.Core.Findings;

/// <summary>
///     Category-aware demotion rules for insight-density scoring (DX-01).
///     All categories are demotion-eligible when the gate predicate fires; resolvable package evidence
///     (including <c>policy-rule:</c> refs from <see cref="InsightDensityGateCandidate.ExtractEvidenceRefs" />)
///     prevents demotion — not Security/Topology/Compliance allowlists.
/// </summary>
internal static class InsightDensityAgentCategoryRules
{
    /// <summary>
    ///     DX-01: every category may demote when score and evidence predicates fire. Protection comes from
    ///     resolvable evidence in <see cref="DeterministicInsightDensityGate" />, not category name.
    /// </summary>
    internal static bool IsDemotionEligibleCategory(string? category) => true;
}
