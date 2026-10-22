using ArchLucid.Contracts.Governance.Posture;

namespace ArchLucid.Application.Governance.Posture;

public interface IExaminationStateResolver
{
    ExaminationStateResolution Resolve(
        string pillarKey,
        IReadOnlyList<PillarPackAssignment> packAssignments,
        DateTimeOffset? latestSnapshotCreatedUtc,
        int uncategorizedCount,
        bool packAssignmentsAvailable);
}
