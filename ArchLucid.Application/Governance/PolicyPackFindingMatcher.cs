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

                if (RuleKeyAppearsAsToken(finding.PolicyRuleId, ruleKey))
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

    private static bool RuleKeyAppearsAsToken(string policyRuleId, string ruleKey)
    {
        int index = 0;

        while (index <= policyRuleId.Length - ruleKey.Length)
        {
            index = policyRuleId.IndexOf(ruleKey, index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            if (IsRuleKeyTokenBoundary(policyRuleId, index, ruleKey.Length))
                return true;

            index++;
        }

        return false;
    }

    private static bool IsRuleKeyTokenBoundary(string policyRuleId, int index, int ruleKeyLength)
    {
        if (index > 0 && char.IsLetterOrDigit(policyRuleId[index - 1]))
            return false;

        int after = index + ruleKeyLength;

        return after >= policyRuleId.Length || !char.IsLetterOrDigit(policyRuleId[after]);
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
