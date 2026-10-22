using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class CachingRunRepository
{
    /// <inheritdoc />
    public async Task<RunStaleUncommittedPurgeBatchResult> HardDeleteStaleUncommittedRunsBatchAsync(
        DateTimeOffset createdBeforeUtc,
        int batchSize,
        CancellationToken ct)
    {
        RunStaleUncommittedPurgeBatchResult result =
            await _inner.HardDeleteStaleUncommittedRunsBatchAsync(createdBeforeUtc, batchSize, ct);

        await InvalidateRunListCachesForArchivedRowsAsync(result.Deleted, ct);

        foreach (ArchivedRunScopeRow row in result.Deleted)
        {
            ScopeContext scope = new() { TenantId = row.TenantId, WorkspaceId = row.WorkspaceId, ProjectId = row.ScopeProjectId };

            await HotPathCacheEviction.RemoveRunAsync(_hotPathReadCache, scope, row.RunId, ct);
        }

        return result;
    }

    /// <inheritdoc />
    public async Task<RunSamplePurgeBatchResult> HardDeleteSampleRunsBatchAsync(
        Guid? tenantId,
        DateTimeOffset? createdBeforeUtc,
        int batchSize,
        CancellationToken ct)
    {
        RunSamplePurgeBatchResult result =
            await _inner.HardDeleteSampleRunsBatchAsync(tenantId, createdBeforeUtc, batchSize, ct);

        await InvalidateRunListCachesForArchivedRowsAsync(result.Deleted, ct);

        foreach (ArchivedRunScopeRow row in result.Deleted)
        {
            ScopeContext scope = new() { TenantId = row.TenantId, WorkspaceId = row.WorkspaceId, ProjectId = row.ScopeProjectId };

            await HotPathCacheEviction.RemoveRunAsync(_hotPathReadCache, scope, row.RunId, ct);
        }

        return result;
    }

    /// <inheritdoc />
    public async Task<RunArchiveBatchResult> ArchiveRunsCreatedBeforeAsync(DateTimeOffset cutoffUtc,
        CancellationToken ct) =>
        await ArchiveRunsCreatedBeforeCoreAsync(
            () => _inner.ArchiveRunsCreatedBeforeAsync(cutoffUtc, ct),
            ct).ConfigureAwait(false);

    /// <inheritdoc />
    public async Task<RunArchiveBatchResult> ArchiveRunsCreatedBeforeForScopeAsync(
        ScopeContext scope,
        DateTimeOffset cutoffUtc,
        CancellationToken ct) =>
        await ArchiveRunsCreatedBeforeCoreAsync(
            () => _inner.ArchiveRunsCreatedBeforeForScopeAsync(scope, cutoffUtc, ct),
            ct).ConfigureAwait(false);

    private async Task<RunArchiveBatchResult> ArchiveRunsCreatedBeforeCoreAsync(
        Func<Task<RunArchiveBatchResult>> archive,
        CancellationToken ct)
    {
        RunArchiveBatchResult batch = await archive().ConfigureAwait(false);

        await InvalidateRunListCachesForArchivedRowsAsync(batch.ArchivedRuns, ct);

        foreach (ArchivedRunScopeRow row in batch.ArchivedRuns)
        {
            ScopeContext scope = new() { TenantId = row.TenantId, WorkspaceId = row.WorkspaceId, ProjectId = row.ScopeProjectId };

            await HotPathCacheEviction.RemoveRunAsync(_hotPathReadCache, scope, row.RunId, ct);
        }

        return batch;
    }

    /// <inheritdoc />
    public async Task<RunArchiveByIdsResult> ArchiveRunsByIdsAsync(IReadOnlyList<Guid> runIds, CancellationToken ct)
    {
        RunArchiveByIdsResult result = await _inner.ArchiveRunsByIdsAsync(runIds, ct);

        await InvalidateRunListCachesForArchivedRowsAsync(result.ArchivedRuns, ct);

        foreach (ArchivedRunScopeRow row in result.ArchivedRuns)
        {
            ScopeContext scope = new() { TenantId = row.TenantId, WorkspaceId = row.WorkspaceId, ProjectId = row.ScopeProjectId };

            await HotPathCacheEviction.RemoveRunAsync(_hotPathReadCache, scope, row.RunId, ct);
        }

        return result;
    }

    private async Task InvalidateRunListCachesForArchivedRowsAsync(
        IReadOnlyList<ArchivedRunScopeRow> rows,
        CancellationToken ct)
    {
        HashSet<(Guid TenantId, Guid WorkspaceId, Guid ProjectId)> seen = [];

        foreach (ArchivedRunScopeRow row in rows)
        {
            if (!seen.Add((row.TenantId, row.WorkspaceId, row.ScopeProjectId)))
                continue;

            ScopeContext scope = new()
            {
                TenantId = row.TenantId,
                WorkspaceId = row.WorkspaceId,
                ProjectId = row.ScopeProjectId,
            };

            await HotPathCacheEviction.InvalidateRunListScopeAsync(_hotPathReadCache, scope, ct);
        }
    }
}
