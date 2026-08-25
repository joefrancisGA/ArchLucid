using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Gates which findings may enter authority snapshot merge and rollups (excludes hypothesis lane).
/// </summary>
public static class AuthorityFindingAuthorityGate
{
    private const string HypothesisFindingType = "ArchitectureIntelligence.AdversarialChallenge";
    private const string HypothesisPolicyRuleId = "architecture-intelligence.adversarial.hypothesis";
    private const string AdversarialLanePropertyKey = "architectureIntelligence.adversarialLane";

    public static bool IsExcludedFromAuthoritySnapshotMerge(Finding finding)
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

    public static List<Finding> ForAuthoritySnapshotMerge(IReadOnlyList<Finding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        return findings.Where(finding => !IsExcludedFromAuthoritySnapshotMerge(finding)).ToList();
    }
}
