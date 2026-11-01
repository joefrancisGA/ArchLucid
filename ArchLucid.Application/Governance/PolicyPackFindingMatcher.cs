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

                if (string.Equals(finding.PolicyRuleId, ruleKey, StringComparison.OrdinalIgnoreCase))
                    return true;

                if (RuleIdentifierMatchesKey(finding.PolicyRuleId, ruleKey))
                    return true;
            }
        }

        if (!string.IsNullOrWhiteSpace(finding.PolicyRuleId)
            && PolicyRuleIdReferencesPack(finding.PolicyRuleId, assignment.PolicyPackId))
            return true;

        if (finding.Properties is not null
            && finding.Properties.TryGetValue("policyPackId", out string? propertyPackId)
            && PackIdsEquivalent(propertyPackId, assignment.PolicyPackId))
            return true;

        return EngineTypeReferencesPack(finding.EngineType, assignment.PolicyPackId);
    }

    private static bool PolicyRuleIdReferencesPack(string policyRuleId, Guid packId)
    {
        if (policyRuleId.Contains(packId.ToString("D"), StringComparison.OrdinalIgnoreCase))
            return true;

        return policyRuleId.Contains(packId.ToString("N"), StringComparison.OrdinalIgnoreCase);
    }

    private static bool EngineTypeReferencesPack(string? engineType, Guid packId)
    {
        if (string.IsNullOrWhiteSpace(engineType))
            return false;

        const string prefix = "policy-pack:";

        if (!engineType.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            return false;

        return PackIdsEquivalent(engineType[prefix.Length..], packId);
    }

    private static bool RuleIdentifierMatchesKey(string policyRuleId, string ruleKey)
    {
        string unwrapped = ExtractRuleIdentifier(policyRuleId);

        return string.Equals(unwrapped, ruleKey, StringComparison.OrdinalIgnoreCase);
    }

    private static string ExtractRuleIdentifier(string policyRuleId)
    {
        const string wrapperPrefix = "policy-pack-";

        if (!policyRuleId.StartsWith(wrapperPrefix, StringComparison.OrdinalIgnoreCase))
            return policyRuleId;

        int guidStart = wrapperPrefix.Length;

        if (policyRuleId.Length > guidStart + 36
            && Guid.TryParseExact(policyRuleId.Substring(guidStart, 36), "D", out _)
            && policyRuleId[guidStart + 36] == '-')
            return policyRuleId[(guidStart + 37)..];

        if (policyRuleId.Length > guidStart + 32
            && Guid.TryParseExact(policyRuleId.Substring(guidStart, 32), "N", out _)
            && policyRuleId[guidStart + 32] == '-')
            return policyRuleId[(guidStart + 33)..];

        return policyRuleId;
    }

    private static bool PackIdsEquivalent(string propertyPackId, Guid assignmentPackId)
    {
        if (string.IsNullOrWhiteSpace(propertyPackId))
            return false;

        string trimmed = propertyPackId.Trim();

        if (Guid.TryParse(trimmed, out Guid parsed))
            return parsed == assignmentPackId;

        return string.Equals(trimmed, assignmentPackId.ToString("D"), StringComparison.OrdinalIgnoreCase);
    }
}
