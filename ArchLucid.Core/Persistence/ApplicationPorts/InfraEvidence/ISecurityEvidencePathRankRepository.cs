namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecurityEvidencePathRankRepository
{
    Task<SecurityEvidencePathRankRecord?> TryGetRankAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecurityEvidencePathRankRecord>> ListBySnapshotAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    Task ReplaceRanksForSnapshotAsync(
        Guid tenantId,
        Guid snapshotId,
        IReadOnlyList<SecurityEvidencePathRankRecord> ranks,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<SecurityEvidencePathRankRecord> Items, int TotalCount)> ListRankedPagedAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid? snapshotId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<SecurityEvidencePathRankWeightsRecord?> TryGetWeightsAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    Task UpsertWeightsAsync(
        SecurityEvidencePathRankWeightsRecord weights,
        CancellationToken cancellationToken = default);
}
