using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class AuditEvidenceSnapshotQueryService(
    IProjectScopedAuditAssessmentRepository assessmentRepository,
    IProjectScopedAuditEvidenceSnapshotRepository snapshotRepository) : IAuditEvidenceSnapshotQueryService
{
    public async Task<IReadOnlyList<AuditEvidenceSnapshotHeaderRecord>> ListSnapshotsAsync(
        ScopeContext scope,
        Guid assessmentId,
        AuditEvidenceReadMode readMode,
        string? baselineName,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (readMode == AuditEvidenceReadMode.Baseline)
        {
            if (string.IsNullOrWhiteSpace(baselineName))
                return [];

            AuditEvidenceBaselineRecord? baseline =
                await snapshotRepository.TryGetBaselineByNameInScopeAsync(
                    scope.ToProjectScopeKey(),
                    assessmentId,
                    baselineName.Trim(),
                    cancellationToken);

            if (baseline is null)
                return [];

            AuditEvidenceSnapshotHeaderRecord? header =
                await snapshotRepository.TryGetHeaderInScopeAsync(
                    scope.ToProjectScopeKey(),
                    baseline.AuditEvidenceSnapshotId,
                    cancellationToken);

            return header is null ? [] : [header];
        }

        IReadOnlyList<AuditEvidenceSnapshotHeaderRecord> snapshots =
            await snapshotRepository.ListByAssessmentInScopeAsync(
                scope.ToProjectScopeKey(),
                assessmentId,
                cancellationToken);

        AuditAssessmentRecord? assessment =
            await assessmentRepository.TryGetByIdInScopeAsync(
                scope.ToProjectScopeKey(),
                assessmentId,
                cancellationToken);

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        return readMode switch
        {
            AuditEvidenceReadMode.Historical => snapshots
                .OrderByDescending(snapshot => snapshot.CollectionCompletedUtc)
                .ToList(),
            AuditEvidenceReadMode.AssessmentPeriod => FilterAssessmentPeriod(snapshots, assessment),
            AuditEvidenceReadMode.Current => FilterCurrent(snapshots, assessment, utcNow),
            _ => snapshots,
        };
    }

    private static IReadOnlyList<AuditEvidenceSnapshotHeaderRecord> FilterAssessmentPeriod(
        IReadOnlyList<AuditEvidenceSnapshotHeaderRecord> snapshots,
        AuditAssessmentRecord? assessment)
    {
        if (assessment?.PeriodStartUtc is null && assessment?.PeriodEndUtc is null)
            return snapshots.OrderByDescending(snapshot => snapshot.CollectionCompletedUtc).ToList();

        return snapshots
            .Where(snapshot => IsWithinPeriod(snapshot.CollectionCompletedUtc, assessment))
            .OrderByDescending(snapshot => snapshot.CollectionCompletedUtc)
            .ToList();
    }

    private static IReadOnlyList<AuditEvidenceSnapshotHeaderRecord> FilterCurrent(
        IReadOnlyList<AuditEvidenceSnapshotHeaderRecord> snapshots,
        AuditAssessmentRecord? assessment,
        DateTime utcNow)
    {
        IReadOnlyList<AuditEvidenceSnapshotHeaderRecord> periodSnapshots =
            FilterAssessmentPeriod(snapshots, assessment);

        if (periodSnapshots.Count == 0)
            return [];

        AuditEvidenceSnapshotHeaderRecord? latestInPeriod = periodSnapshots
            .Where(snapshot => IsWithinPeriod(snapshot.CollectionCompletedUtc, assessment, utcNow))
            .OrderByDescending(snapshot => snapshot.CollectionCompletedUtc)
            .FirstOrDefault();

        if (latestInPeriod is not null)
            return [latestInPeriod];

        return [periodSnapshots[0]];
    }

    private static bool IsWithinPeriod(
        DateTime collectionCompletedUtc,
        AuditAssessmentRecord? assessment,
        DateTime? referenceUtc = null)
    {
        DateTime reference = referenceUtc ?? collectionCompletedUtc;

        if (assessment?.PeriodStartUtc is not null && collectionCompletedUtc < assessment.PeriodStartUtc)
            return false;

        if (assessment?.PeriodEndUtc is not null && collectionCompletedUtc > assessment.PeriodEndUtc)
            return false;

        if (referenceUtc is not null)
        {
            if (assessment?.PeriodStartUtc is not null && reference < assessment.PeriodStartUtc)
                return false;

            if (assessment?.PeriodEndUtc is not null && reference > assessment.PeriodEndUtc)
                return false;
        }

        return true;
    }
}
