using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Filters hypothesis-lane findings from authority rollups, finalize blockers, and coverage metrics.
/// </summary>
public static class AuthorityFindingRollupFilter
{
    private const string HypothesisFindingType = "ArchitectureIntelligence.AdversarialChallenge";
    private const string HypothesisPolicyRuleId = "architecture-intelligence.adversarial.hypothesis";
    private const string AdversarialLanePropertyKey = "architectureIntelligence.adversarialLane";

    public static bool IsExcludedFromAuthorityRollup(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (string.Equals(finding.FindingType, HypothesisFindingType, StringComparison.Ordinal))
            return true;

        if (string.Equals(finding.PolicyRuleId, HypothesisPolicyRuleId, StringComparison.OrdinalIgnoreCase))
            return true;

        if (finding.Properties is not null
            && finding.Properties.TryGetValue(AdversarialLanePropertyKey, out string? lane)
            && string.Equals(lane, AdversarialLane.AdversarialChallenge.ToString(), StringComparison.Ordinal))
            return true;

        return false;
    }

    public static List<Finding> ForAuthorityRollup(IReadOnlyList<Finding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        return findings.Where(finding => !IsExcludedFromAuthorityRollup(finding)).ToList();
    }
}
