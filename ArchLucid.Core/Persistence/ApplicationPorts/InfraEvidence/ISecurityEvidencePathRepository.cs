using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecurityEvidencePathRepository
{
    Task<SecurityEvidencePathRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default);

    async Task<SecurityEvidencePathRecord?> TryGetByIdInScopeAsync(
        ProjectScopeKey scope,
        Guid pathId,
        CancellationToken cancellationToken = default)
    {
        SecurityEvidencePathRecord? record =
            await TryGetByIdAsync(scope.TenantId, pathId, cancellationToken);

        return record is not null
               && scope.Matches(record.TenantId, record.WorkspaceId, record.ProjectId)
            ? record
            : null;
    }

    Task<SecurityEvidencePathRecord?> TryGetByCanonicalHashAsync(
        Guid tenantId,
        Guid snapshotId,
        byte[] canonicalHopHashSha256,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecurityEvidencePathHopRecord>> ListHopsByPathAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecurityEvidencePathHopRecord>> ListHopsByPathInScopeAsync(
        ProjectScopeKey scope,
        Guid pathId,
        CancellationToken cancellationToken = default) =>
        ListHopsByPathAsync(scope.TenantId, pathId, cancellationToken);

    Task<SecurityEvidencePathInsertResult> InsertIfNotExistsAsync(
        SecurityEvidencePathRecord pathHeader,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<SecurityEvidencePathRecord> Items, int TotalCount)> ListPagedAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        SecurityEvidencePathListFilter filter,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecurityEvidencePathRecord>> ListBySnapshotAsync(
        ProjectSnapshotScopeKey scope,
        CancellationToken cancellationToken = default);
}
