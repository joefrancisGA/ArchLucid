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
