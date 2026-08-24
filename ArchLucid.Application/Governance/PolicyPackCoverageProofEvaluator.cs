using System.Text.Json;

using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance.Resolution;

namespace ArchLucid.Application.Governance;

public sealed class PolicyPackCoverageProofResult
{
    public int AssignmentCount
    {
        get;
        init;
    }

    public int UnprovenAssignmentCount
    {
        get;
        init;
    }
}

public static class PolicyPackCoverageProofEvaluator
{
    public static PolicyPackCoverageProofResult Evaluate(
        string governanceScopeJson,
        IReadOnlyList<Finding> findings)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(governanceScopeJson);
        ArgumentNullException.ThrowIfNull(findings);

        ExecutedEffectiveGovernanceSnapshotDescriptor? descriptor =
            JsonSerializer.Deserialize<ExecutedEffectiveGovernanceSnapshotDescriptor>(governanceScopeJson);

        if (descriptor?.PackAssignments is not { Count: > 0 } assignments)
        {
            return new PolicyPackCoverageProofResult
            {
                AssignmentCount = 0,
                UnprovenAssignmentCount = 0,
            };
        }

        HashSet<string> triggeredPolicyRuleIds = findings
            .Where(finding => !string.IsNullOrWhiteSpace(finding.PolicyRuleId))
            .Select(finding => finding.PolicyRuleId!)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        int unproven = 0;

        foreach (CommittedGovernancePackAssignmentSnapshot assignment in assignments)
        {
            string packToken = assignment.PolicyPackId.ToString("D");

            bool hasSignal = triggeredPolicyRuleIds.Any(ruleId =>
                ruleId.Contains(packToken, StringComparison.OrdinalIgnoreCase));

            if (!hasSignal)
                unproven++;
        }

        return new PolicyPackCoverageProofResult
        {
            AssignmentCount = assignments.Count,
            UnprovenAssignmentCount = unproven,
        };
    }
}
