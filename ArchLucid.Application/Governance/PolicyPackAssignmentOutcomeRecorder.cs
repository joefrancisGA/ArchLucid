using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance.Resolution;

namespace ArchLucid.Application.Governance;

public static class PolicyPackAssignmentOutcomeRecorder
{
    public static string ApplyOutcomes(
        string governanceScopeJson,
        IReadOnlyList<Finding> findings,
        FindingsSnapshot? findingsSnapshot)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(governanceScopeJson);
        ArgumentNullException.ThrowIfNull(findings);

        ExecutedEffectiveGovernanceSnapshotDescriptor? descriptor =
            ExecutedEffectiveGovernanceSnapshotJson.TryDeserialize(governanceScopeJson);

        if (descriptor?.PackAssignments is not { Count: > 0 } assignments)
            return governanceScopeJson;

        HashSet<string> triggeredPolicyRuleIds = findings
            .Where(finding => !string.IsNullOrWhiteSpace(finding.PolicyRuleId))
            .Select(finding => finding.PolicyRuleId!)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        bool findingsComplete = findingsSnapshot?.GenerationStatus == FindingsSnapshotGenerationStatus.Complete;
        bool findingsFailed = findingsSnapshot?.GenerationStatus == FindingsSnapshotGenerationStatus.Failed;

        foreach (CommittedGovernancePackAssignmentSnapshot assignment in assignments)
        {
            assignment.EvaluationOutcome = DetermineOutcome(
                assignment,
                triggeredPolicyRuleIds,
                findingsSnapshot,
                findingsComplete,
                findingsFailed);
        }

        return ExecutedEffectiveGovernanceSnapshotJson.Serialize(descriptor);
    }

    private static string DetermineOutcome(
        CommittedGovernancePackAssignmentSnapshot assignment,
        HashSet<string> triggeredPolicyRuleIds,
        FindingsSnapshot? findingsSnapshot,
        bool findingsComplete,
        bool findingsFailed)
    {
        string packToken = assignment.PolicyPackId.ToString("D");

        if (findingsFailed || HasPackEvaluationFailure(findingsSnapshot, packToken))
            return PolicyPackEvaluationOutcomes.Failed;

        if (descriptorNotApplicable(assignment, findingsSnapshot))
            return PolicyPackEvaluationOutcomes.NotApplicable;

        if (!findingsComplete && findingsSnapshot is not null)
            return PolicyPackEvaluationOutcomes.Skipped;

        bool hasSignal = triggeredPolicyRuleIds.Any(ruleId =>
            ruleId.Contains(packToken, StringComparison.OrdinalIgnoreCase));

        if (hasSignal || findingsComplete)
            return PolicyPackEvaluationOutcomes.Evaluated;

        return PolicyPackEvaluationOutcomes.Skipped;
    }

    private static bool descriptorNotApplicable(
        CommittedGovernancePackAssignmentSnapshot assignment,
        FindingsSnapshot? findingsSnapshot)
    {
        if (findingsSnapshot is null)
            return false;

        return findingsSnapshot.EngineFailures.Any(failure =>
            failure.EngineType.Contains(assignment.PolicyPackId.ToString("D"), StringComparison.OrdinalIgnoreCase)
            && failure.ErrorMessage.Contains("not applicable", StringComparison.OrdinalIgnoreCase));
    }

    private static bool HasPackEvaluationFailure(FindingsSnapshot? findingsSnapshot, string packToken)
    {
        if (findingsSnapshot is null)
            return false;

        return findingsSnapshot.EngineFailures.Any(failure =>
            failure.EngineType.Contains("policy", StringComparison.OrdinalIgnoreCase)
            && (failure.ErrorMessage.Contains(packToken, StringComparison.OrdinalIgnoreCase)
                || failure.EngineType.Contains(packToken, StringComparison.OrdinalIgnoreCase)));
    }
}
