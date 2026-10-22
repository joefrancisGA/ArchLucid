using ArchLucid.Application.ArchitectureIntelligence;
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

        List<Finding> rollupFindings = AuthorityFindingRollupFilter.ForAuthorityRollup(findings)
            .Where(static finding => !finding.IsMuted)
            .ToList();

        ExecutedEffectiveGovernanceSnapshotDescriptor? descriptor =
            ExecutedEffectiveGovernanceSnapshotJson.TryDeserialize(governanceScopeJson);

        if (descriptor?.PackAssignments is not { Count: > 0 } assignments)
            return governanceScopeJson;

        bool findingsComplete = findingsSnapshot?.GenerationStatus == FindingsSnapshotGenerationStatus.Complete;
        bool findingsFailed = findingsSnapshot?.GenerationStatus == FindingsSnapshotGenerationStatus.Failed;

        foreach (CommittedGovernancePackAssignmentSnapshot assignment in assignments)
        {
            assignment.EvaluationOutcome = DetermineOutcome(
                assignment,
                rollupFindings,
                findingsSnapshot,
                findingsComplete,
                findingsFailed);
        }

        return ExecutedEffectiveGovernanceSnapshotJson.Serialize(descriptor);
    }

    private static string DetermineOutcome(
        CommittedGovernancePackAssignmentSnapshot assignment,
        IReadOnlyList<Finding> findings,
        FindingsSnapshot? findingsSnapshot,
        bool findingsComplete,
        bool findingsFailed)
    {
        string packToken = assignment.PolicyPackId.ToString("D");

        if (findingsFailed || HasPackEvaluationFailure(findingsSnapshot, packToken))
            return PolicyPackEvaluationOutcomes.Failed;

        if (descriptorNotApplicable(assignment, findingsSnapshot))
            return PolicyPackEvaluationOutcomes.NotApplicable;

        if (findingsSnapshot is null)
            return PolicyPackEvaluationOutcomes.Skipped;

        if (!findingsComplete)
        {
            if (findings.Any(finding => PolicyPackFindingMatcher.MatchesAssignment(finding, assignment)))
                return PolicyPackEvaluationOutcomes.Evaluated;

            return PolicyPackEvaluationOutcomes.Skipped;
        }

        return PolicyPackEvaluationOutcomes.Evaluated;
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
