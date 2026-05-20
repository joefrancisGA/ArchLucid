using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Rolls up projected USD impact for cost findings that are accepted for savings reporting.
/// </summary>
public static class FindingsSnapshotEstimatedSavingsCalculator
{
    /// <summary>
    ///     Sums <see cref="Finding.ProjectedImpactUsd" /> for Cost-category findings whose human review is
    ///     <see cref="FindingHumanReviewStatus.Approved" /> or does not require review.
    /// </summary>
    public static decimal ComputeTotal(IReadOnlyList<Finding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        return findings
            .Where(IsAcceptedCostFinding)
            .Sum(static f => f.ProjectedImpactUsd ?? 0m);
    }

    private static bool IsAcceptedCostFinding(Finding finding)
    {
        if (!string.Equals(finding.Category, "Cost", StringComparison.OrdinalIgnoreCase))
            return false;

        return finding.HumanReviewStatus is FindingHumanReviewStatus.Approved
            or FindingHumanReviewStatus.NotRequired;
    }
}
