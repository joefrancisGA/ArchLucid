namespace ArchLucid.Contracts.Pilots;

/// <summary>
///     Governed-finding coverage for a single committed review package.
///     Classifies decision-grade findings as governance-blocking (<c>PolicyViolation</c>) or advisory-only,
///     and counts those with policy-rule traces and evidence references.
/// </summary>
/// <remarks>
///     <see cref="IsAvailable" /> is <see langword="false" /> when the run has no persisted decision-grade
///     findings (e.g. very early state or runs without a committed snapshot). Consumers MUST check
///     <see cref="IsAvailable" /> before rendering the metric to avoid showing 0/0 as meaningful coverage.
/// </remarks>
public sealed class GovernedFindingCoverageMetric
{
    /// <summary>
    ///     Total number of decision-grade findings from the run. Zero means the run produced no findings
    ///     (check <see cref="IsAvailable" />).
    /// </summary>
    public int TotalDecisionGradeCount { get; init; }

    /// <summary>Findings classified as governance-blocking (<c>FindingEnforcementTier.PolicyViolation</c>).</summary>
    public int GovernedCount { get; init; }

    /// <summary>Findings classified as advisory-only (<c>FindingEnforcementTier.Advisory</c>).</summary>
    public int AdvisoryCount { get; init; }

    /// <summary>Findings with a non-null <c>PolicyRuleId</c> linking to a curated pack rule.</summary>
    public int WithPolicyRuleCount { get; init; }

    /// <summary>Findings with at least one entry in their <c>EvidenceRefs</c> list.</summary>
    public int WithEvidenceRefsCount { get; init; }

    /// <summary>
    ///     Percentage of findings that are governance-blocking, rounded to one decimal place.
    ///     <see langword="null" /> when <see cref="TotalDecisionGradeCount" /> is zero.
    /// </summary>
    public double? GovernedPercentage { get; init; }

    /// <summary>
    ///     <see langword="false" /> when the run has no decision-grade findings; metric should render as
    ///     "not available" rather than "0 of 0".
    /// </summary>
    public bool IsAvailable { get; init; }

    /// <summary>Builds a metric from a flat sequence of finding descriptors.</summary>
    public static GovernedFindingCoverageMetric Compute(
        int totalDecisionGradeCount,
        int governedCount,
        int advisoryCount,
        int withPolicyRuleCount,
        int withEvidenceRefsCount)
    {
        bool available = totalDecisionGradeCount > 0;
        double? percentage = available
            ? Math.Round((double)governedCount / totalDecisionGradeCount * 100.0, 1)
            : null;

        return new GovernedFindingCoverageMetric
        {
            TotalDecisionGradeCount = totalDecisionGradeCount,
            GovernedCount = governedCount,
            AdvisoryCount = advisoryCount,
            WithPolicyRuleCount = withPolicyRuleCount,
            WithEvidenceRefsCount = withEvidenceRefsCount,
            GovernedPercentage = percentage,
            IsAvailable = available,
        };
    }

    /// <summary>Returns the canonical "not available" singleton for runs with no findings.</summary>
    public static GovernedFindingCoverageMetric NotAvailable() =>
        new() { IsAvailable = false };
}
