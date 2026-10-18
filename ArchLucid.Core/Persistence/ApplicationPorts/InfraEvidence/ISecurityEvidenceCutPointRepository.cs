using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecurityEvidenceCutPointRepository
{
    Task<IReadOnlyList<SecurityEvidenceCutPointRecord>> ListBySnapshotAsync(
        ProjectSnapshotScopeKey scope,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecurityEvidenceCutPointRecord>> ListByPathIdAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecurityEvidenceCutPointRecord>> ListByPathIdInScopeAsync(
        ProjectScopeKey scope,
        Guid pathId,
        CancellationToken cancellationToken = default) =>
        ListByPathIdAsync(scope.TenantId, pathId, cancellationToken);

    async Task<IReadOnlyList<SecurityEvidenceCutPointRecord>> ListBySnapshotsInScopeAsync(
        ProjectScopeKey scope,
        IReadOnlyCollection<Guid> snapshotIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(snapshotIds);

        List<SecurityEvidenceCutPointRecord> cutPoints = [];

        foreach (Guid snapshotId in snapshotIds.Where(id => id != Guid.Empty).Distinct())
        {
            IReadOnlyList<SecurityEvidenceCutPointRecord> rows = await ListBySnapshotAsync(
                ProjectSnapshotScopeKey.Create(scope, snapshotId),
                cancellationToken);
            cutPoints.AddRange(rows);
        }

        return cutPoints;
    }

    Task ReplaceCutPointsForSnapshotAsync(
        Guid tenantId,
        Guid snapshotId,
        IReadOnlyList<SecurityEvidenceCutPointRecord> cutPoints,
        CancellationToken cancellationToken = default);

    Task ReplaceCutPointsForSnapshotInScopeAsync(
        ProjectScopeKey scope,
        Guid snapshotId,
        IReadOnlyList<SecurityEvidenceCutPointRecord> cutPoints,
        CancellationToken cancellationToken = default) =>
        ReplaceCutPointsForSnapshotAsync(scope.TenantId, snapshotId, cutPoints, cancellationToken);
}
