using ArchLucid.Contracts.Governance.Posture;

namespace ArchLucid.Application.Governance.Posture;

public sealed class ExaminationStateResolver : IExaminationStateResolver
{
    public const string UnavailableReason = "Policy pack assignment data is unavailable for this scope.";
    public const string NotExaminedReason = "No policy pack is assigned for this pillar.";
    public const string DisabledOnlyReason = "Only disabled policy packs are assigned for this pillar.";
    public const string NoSnapshotReason = "No findings snapshot exists for this scope.";
    public const string SnapshotPredatesAssignmentReason = "The latest findings snapshot predates the pack assignment.";
    public const string UncategorizedReason = "Uncategorized findings remain outside pillar taxonomy.";
    public const string ExaminedReason = "An enabled policy pack is assigned and the latest snapshot reflects current coverage.";

    public ExaminationStateResolution Resolve(
        string pillarKey,
        IReadOnlyList<PillarPackAssignment> packAssignments,
        DateTimeOffset? latestSnapshotCreatedUtc,
        int uncategorizedCount,
        bool packAssignmentsAvailable)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(pillarKey);

        if (!packAssignmentsAvailable)
        {
            return new ExaminationStateResolution
            {
                State = PillarExaminationState.Unavailable,
                ReasonText = UnavailableReason,
            };
        }

        List<PillarPackAssignment> pillarAssignments = packAssignments
            .Where(assignment => string.Equals(assignment.PillarKey, pillarKey, StringComparison.Ordinal))
            .ToList();

        if (pillarAssignments.Count == 0)
        {
            return new ExaminationStateResolution
            {
                State = PillarExaminationState.NotExamined,
                ReasonText = NotExaminedReason,
            };
        }

        List<PillarPackAssignment> enabledAssignments = pillarAssignments
            .Where(assignment => assignment.IsEnabled)
            .ToList();

        if (enabledAssignments.Count == 0)
        {
            return new ExaminationStateResolution
            {
                State = PillarExaminationState.PartiallyExamined,
                ReasonText = DisabledOnlyReason,
            };
        }

        if (latestSnapshotCreatedUtc is null)
        {
            return new ExaminationStateResolution
            {
                State = PillarExaminationState.PartiallyExamined,
                ReasonText = NoSnapshotReason,
            };
        }

        DateTimeOffset latestEnabledAssignmentUtc = enabledAssignments
            .Select(assignment => assignment.AssignedUtc)
            .Max();

        if (latestSnapshotCreatedUtc < latestEnabledAssignmentUtc)
        {
            return new ExaminationStateResolution
            {
                State = PillarExaminationState.PartiallyExamined,
                ReasonText = SnapshotPredatesAssignmentReason,
            };
        }

        if (uncategorizedCount > 0)
        {
            return new ExaminationStateResolution
            {
                State = PillarExaminationState.PartiallyExamined,
                ReasonText = UncategorizedReason,
            };
        }

        return new ExaminationStateResolution
        {
            State = PillarExaminationState.Examined,
            ReasonText = ExaminedReason,
        };
    }
}
