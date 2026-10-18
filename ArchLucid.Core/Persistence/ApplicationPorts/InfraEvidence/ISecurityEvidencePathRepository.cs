using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecurityEvidencePathRepository
{
    async Task<IReadOnlyList<SecurityEvidencePathWithHops>> ListWithHopsBySnapshotAsync(
        ProjectSnapshotScopeKey scope,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<SecurityEvidencePathRecord> paths = await ListBySnapshotAsync(scope, cancellationToken);
        List<SecurityEvidencePathWithHops> result = [];
        foreach (SecurityEvidencePathRecord path in paths)
            result.Add(new(path, await ListHopsByPathInScopeAsync(scope.Project, path.PathId, cancellationToken)));
        return result;
    }

    /// <summary>Returns results in input order, including entries deduplicated by canonical hash.</summary>
    async Task<IReadOnlyList<SecurityEvidencePathInsertResult>> InsertBatchIfNotExistsAsync(
        IReadOnlyList<SecurityEvidencePathWithHops> paths,
        CancellationToken cancellationToken = default)
    {
        List<SecurityEvidencePathInsertResult> result = [];
        foreach (SecurityEvidencePathWithHops path in paths)
            result.Add(await InsertIfNotExistsAsync(path.Path, path.Hops, cancellationToken));
        return result;
    }

    Task<SecurityEvidencePathRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default);

    async Task<IReadOnlyList<SecurityEvidencePathRecord>> ListByIdsInScopeAsync(
        ProjectScopeKey scope,
        IReadOnlyCollection<Guid> pathIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(pathIds);

        List<SecurityEvidencePathRecord> paths = [];

        foreach (Guid pathId in pathIds.Distinct())
        {
            SecurityEvidencePathRecord? path =
                await TryGetByIdInScopeAsync(scope, pathId, cancellationToken);

            if (path is not null)
            {
                paths.Add(path);
            }
        }

        return paths;
    }

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
