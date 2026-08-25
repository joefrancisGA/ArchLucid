using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance.Resolution;

namespace ArchLucid.Application.Governance;

internal static class PolicyPackFindingMatcher
{
    public static bool MatchesAssignment(
        Finding finding,
        CommittedGovernancePackAssignmentSnapshot assignment)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(assignment);

        if (assignment.ComplianceRuleKeys is { Count: > 0 } ruleKeys
            && !string.IsNullOrWhiteSpace(finding.PolicyRuleId))
        {
            foreach (string ruleKey in ruleKeys)
            {
                if (string.IsNullOrWhiteSpace(ruleKey))
                    continue;

                if (string.Equals(finding.PolicyRuleId, ruleKey, StringComparison.OrdinalIgnoreCase)
                    || finding.PolicyRuleId.Contains(ruleKey, StringComparison.OrdinalIgnoreCase))
                    return true;
            }

            return false;
        }

        string packToken = assignment.PolicyPackId.ToString("D");

        if (!string.IsNullOrWhiteSpace(finding.PolicyRuleId)
            && finding.PolicyRuleId.Contains(packToken, StringComparison.OrdinalIgnoreCase))
            return true;

        if (finding.Properties is not null
            && finding.Properties.TryGetValue("policyPackId", out string? propertyPackId)
            && string.Equals(propertyPackId, packToken, StringComparison.OrdinalIgnoreCase))
            return true;

        return string.Equals(finding.EngineType, $"policy-pack:{packToken}", StringComparison.OrdinalIgnoreCase);
    }
}
