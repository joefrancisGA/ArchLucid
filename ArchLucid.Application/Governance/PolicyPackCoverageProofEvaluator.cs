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
            ExecutedEffectiveGovernanceSnapshotJson.TryDeserialize(governanceScopeJson);

        if (descriptor?.PackAssignments is not { Count: > 0 } assignments)
        {
            return new PolicyPackCoverageProofResult
            {
                AssignmentCount = 0,
                UnprovenAssignmentCount = 0,
            };
        }

        int unproven = 0;

        foreach (CommittedGovernancePackAssignmentSnapshot assignment in assignments)
        {
            bool hasFindingSignal = findings.Any(finding =>
                !finding.IsMuted && PolicyPackFindingMatcher.MatchesAssignment(finding, assignment));

            if (hasFindingSignal || HasRecordedEvaluationOutcome(assignment.EvaluationOutcome))
                continue;

            unproven++;
        }

        return new PolicyPackCoverageProofResult
        {
            AssignmentCount = assignments.Count,
            UnprovenAssignmentCount = unproven,
        };
    }

    private static bool HasRecordedEvaluationOutcome(string? evaluationOutcome)
    {
        if (string.IsNullOrWhiteSpace(evaluationOutcome))
            return false;

        return string.Equals(evaluationOutcome, PolicyPackEvaluationOutcomes.Evaluated, StringComparison.Ordinal)
               || string.Equals(evaluationOutcome, PolicyPackEvaluationOutcomes.Failed, StringComparison.Ordinal)
               || string.Equals(evaluationOutcome, PolicyPackEvaluationOutcomes.NotApplicable, StringComparison.Ordinal);
    }
}
