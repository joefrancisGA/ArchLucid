using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpSecurityEvidenceCutPointRepository : ISecurityEvidenceCutPointRepository
{
    public Task<IReadOnlyList<SecurityEvidenceCutPointRecord>> ListBySnapshotAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<SecurityEvidenceCutPointRecord>>([]);

    public Task<IReadOnlyList<SecurityEvidenceCutPointRecord>> ListByPathIdAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<SecurityEvidenceCutPointRecord>>([]);

    public Task ReplaceCutPointsForSnapshotAsync(
        Guid tenantId,
        Guid snapshotId,
        IReadOnlyList<SecurityEvidenceCutPointRecord> cutPoints,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;
}
