using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpSecurityEvidencePathRankRepository : ISecurityEvidencePathRankRepository
{
    public Task<SecurityEvidencePathRankRecord?> TryGetRankAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<SecurityEvidencePathRankRecord?>(null);

    public Task<IReadOnlyList<SecurityEvidencePathRankRecord>> ListBySnapshotAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<SecurityEvidencePathRankRecord>>([]);

    public Task ReplaceRanksForSnapshotAsync(
        Guid tenantId,
        Guid snapshotId,
        IReadOnlyList<SecurityEvidencePathRankRecord> ranks,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<(IReadOnlyList<SecurityEvidencePathRankRecord> Items, int TotalCount)> ListRankedPagedAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid? snapshotId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
        => Task.FromResult<(IReadOnlyList<SecurityEvidencePathRankRecord> Items, int TotalCount)>(([], 0));

    public Task<SecurityEvidencePathRankWeightsRecord?> TryGetWeightsAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<SecurityEvidencePathRankWeightsRecord?>(null);

    public Task UpsertWeightsAsync(
        SecurityEvidencePathRankWeightsRecord weights,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;
}
