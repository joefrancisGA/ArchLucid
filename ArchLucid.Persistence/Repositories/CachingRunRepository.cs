using System.Data;

using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     Decorates <see cref="IRunRepository" /> with hot-path read caching and evicts on single-row writes and after bulk
///     archival.
/// </summary>
public sealed class CachingRunRepository(IRunRepository inner, IHotPathReadCache hotPathReadCache) : IRunRepository
{
    /// <summary>Short TTL for dashboard first-page lists; scope revision bump invalidates on writes (TB-578).</summary>
    private const int ListAbsoluteExpirationSeconds = 15;

    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    private readonly IRunRepository _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public Task<RunRecord?> GetByIdAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return _hotPathReadCache.GetOrCreateAsync(
            HotPathCacheKeys.Run(scope, runId),
            innerCt => _inner.GetByIdAsync(scope, runId, innerCt),
            ct);
    }

    /// <inheritdoc />
    public Task<RunRecord?> GetByIdIncludingArchivedAsync(ScopeContext scope, Guid runId, CancellationToken ct)
        => _inner.GetByIdIncludingArchivedAsync(scope, runId, ct);

    /// <inheritdoc />
    public Task<RunRecord?> GetByRunIdAdminAsync(Guid runId, CancellationToken ct)
        => _inner.GetByRunIdAdminAsync(runId, ct);

    /// <inheritdoc />
    public Task<RunRecord?> GetLatestWithGraphAtOrBeforeAsync(
        ScopeContext scope,
        string authorityProjectSlug,
        DateTime asOfUtc,
        CancellationToken ct)
        => _inner.GetLatestWithGraphAtOrBeforeAsync(scope, authorityProjectSlug, asOfUtc, ct);

    /// <inheritdoc />
    public Task<Guid?> GetLatestCommittedRunIdByManifestCreatedUtcAsync(
        ScopeContext scope,
        string projectId,
        CancellationToken ct)
        => _inner.GetLatestCommittedRunIdByManifestCreatedUtcAsync(scope, projectId, ct);

    /// <inheritdoc />
    public Task<Guid?> GetPriorCommittedRunIdBeforeCurrentAsync(
        ScopeContext scope,
        string projectId,
        Guid currentRunId,
        DateTime currentCreatedUtc,
        CancellationToken ct)
        => _inner.GetPriorCommittedRunIdBeforeCurrentAsync(
            scope,
            projectId,
            currentRunId,
            currentCreatedUtc,
            ct);

    /// <inheritdoc />
    public async Task<IReadOnlyList<RunRecord>> ListByProjectAsync(
        ScopeContext scope,
        string projectId,
        int take,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        int safeTake = Math.Clamp(take <= 0 ? 20 : take, 1, 200);
        long revision = await ReadRunListScopeRevisionAsync(scope, ct);
        string key = HotPathCacheKeys.RunListByProjectFirstPage(scope, projectId, safeTake, revision);

        IReadOnlyList<RunRecord>? cached = await _hotPathReadCache.GetOrCreateAsync(
            key,
            async innerCt => await _inner.ListByProjectAsync(scope, projectId, safeTake, innerCt),
            ct,
            absoluteExpirationSecondsOverride: ListAbsoluteExpirationSeconds);

        return cached ?? [];
    }

    /// <inheritdoc />
    public async Task<RunListPage> ListByProjectKeysetAsync(
        ScopeContext scope,
        string projectId,
        DateTime? cursorCreatedUtc,
        Guid? cursorRunId,
        int take,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (cursorCreatedUtc.HasValue || cursorRunId.HasValue)
            return await _inner.ListByProjectKeysetAsync(scope, projectId, cursorCreatedUtc, cursorRunId, take, ct);

        int clampedTake = RunPagination.ClampTake(take);
        long revision = await ReadRunListScopeRevisionAsync(scope, ct);
        string key = HotPathCacheKeys.RunListByProjectFirstPage(scope, projectId, clampedTake, revision);

        RunListPage? cached = await _hotPathReadCache.GetOrCreateAsync(
            key,
            async innerCt =>
                await _inner.ListByProjectKeysetAsync(scope, projectId, null, null, clampedTake, innerCt),
            ct,
            absoluteExpirationSecondsOverride: ListAbsoluteExpirationSeconds);

        return cached ?? throw new InvalidOperationException("Run list cache returned null unexpectedly.");
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<RunRecord>> ListRecentInScopeAsync(ScopeContext scope, int take, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        int safeTake = Math.Clamp(take <= 0 ? 200 : take, 1, 200);
        long revision = await ReadRunListScopeRevisionAsync(scope, ct);
        string key = HotPathCacheKeys.RunListRecentInScopeFirstPage(scope, safeTake, revision);

        IReadOnlyList<RunRecord>? cached = await _hotPathReadCache.GetOrCreateAsync(
            key,
            async innerCt => await _inner.ListRecentInScopeAsync(scope, safeTake, innerCt),
            ct,
            absoluteExpirationSecondsOverride: ListAbsoluteExpirationSeconds);

        return cached ?? [];
    }

    /// <inheritdoc />
    public async Task<RunListPage> ListRecentInScopeKeysetAsync(
        ScopeContext scope,
        DateTime? cursorCreatedUtc,
        Guid? cursorRunId,
        int take,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (cursorCreatedUtc.HasValue || cursorRunId.HasValue)
            return await _inner.ListRecentInScopeKeysetAsync(scope, cursorCreatedUtc, cursorRunId, take, ct);

        int clampedTake = RunPagination.ClampTake(take);
        long revision = await ReadRunListScopeRevisionAsync(scope, ct);
        string key = HotPathCacheKeys.RunListRecentInScopeFirstPage(scope, clampedTake, revision);

        RunListPage? cached = await _hotPathReadCache.GetOrCreateAsync(
            key,
            async innerCt =>
                await _inner.ListRecentInScopeKeysetAsync(scope, null, null, clampedTake, innerCt),
            ct,
            absoluteExpirationSecondsOverride: ListAbsoluteExpirationSeconds);

        return cached ?? throw new InvalidOperationException("Run list cache returned null unexpectedly.");
    }

    /// <inheritdoc />
    public async Task<RunListPage> ListRecentInScopeOffsetAsync(
        ScopeContext scope,
        int offset,
        int limit,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        int safeLimit = RunPagination.ClampLimit(limit);
        int safeOffset = RunPagination.NormalizeOffset(offset);

        if (safeOffset > 0)
            return await _inner.ListRecentInScopeOffsetAsync(scope, safeOffset, safeLimit, ct);

        long revision = await ReadRunListScopeRevisionAsync(scope, ct);
        string key = HotPathCacheKeys.RunListRecentInScopeFirstPage(scope, safeLimit, revision);

        RunListPage? cached = await _hotPathReadCache.GetOrCreateAsync(
            key,
            async innerCt =>
                await _inner.ListRecentInScopeOffsetAsync(scope, 0, safeLimit, innerCt),
            ct,
            absoluteExpirationSecondsOverride: ListAbsoluteExpirationSeconds);

        return cached ?? throw new InvalidOperationException("Run list cache returned null unexpectedly.");
    }

    /// <inheritdoc />
    public Task<int> CountActiveRunsForArchitectureRequestAsync(
        ScopeContext scope,
        string architectureRequestId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return _inner.CountActiveRunsForArchitectureRequestAsync(scope, architectureRequestId, ct);
    }

    /// <inheritdoc />
    public Task<bool> ExistsRunForArchitectureRequestInScopeAsync(
        ScopeContext scope,
        string architectureRequestId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return _inner.ExistsRunForArchitectureRequestInScopeAsync(scope, architectureRequestId, ct);
    }

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
    public async Task SaveAsync(
        RunRecord run,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        await _inner.SaveAsync(run, ct, connection, transaction);

        ScopeContext scope = ScopeForRun(run);
        await HotPathCacheEviction.RemoveRunAsync(_hotPathReadCache, scope, run.RunId, ct);
        await HotPathCacheEviction.InvalidateRunListScopeAsync(_hotPathReadCache, scope, ct);
    }

    /// <inheritdoc />
    public async Task UpdateAsync(
        RunRecord run,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        await _inner.UpdateAsync(run, ct, connection, transaction);

        ScopeContext scope = ScopeForRun(run);
        await HotPathCacheEviction.RemoveRunAsync(_hotPathReadCache, scope, run.RunId, ct);
        await HotPathCacheEviction.InvalidateRunListScopeAsync(_hotPathReadCache, scope, ct);
    }

    /// <inheritdoc />
    public async Task<bool> TrySetOperatorGovernanceDispositionAsync(
        ScopeContext scope,
        Guid runId,
        string decision,
        string? rationale,
        string actorUserId,
        DateTime occurredUtc,
        CancellationToken ct)
    {
        bool updated = await _inner.TrySetOperatorGovernanceDispositionAsync(
            scope,
            runId,
            decision,
            rationale,
            actorUserId,
            occurredUtc,
            ct);

        if (updated)
        {
            await HotPathCacheEviction.RemoveRunAsync(_hotPathReadCache, scope, runId, ct);
            await HotPathCacheEviction.InvalidateRunListScopeAsync(_hotPathReadCache, scope, ct);
        }

        return updated;
    }

    /// <inheritdoc />
    public async Task<RunArchiveBatchResult> ArchiveRunsCreatedBeforeAsync(DateTimeOffset cutoffUtc,
        CancellationToken ct)
    {
        RunArchiveBatchResult batch = await _inner.ArchiveRunsCreatedBeforeAsync(cutoffUtc, ct);

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

    private async Task<long> ReadRunListScopeRevisionAsync(ScopeContext scope, CancellationToken ct)
    {
        string revisionKey = HotPathCacheKeys.RunListScopeRevision(scope);

        RunListScopeRevisionState? state = await _hotPathReadCache.GetOrCreateAsync(
            revisionKey,
            _ => Task.FromResult<RunListScopeRevisionState?>(new RunListScopeRevisionState { Revision = 0 }),
            ct);

        return state?.Revision ?? 0;
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

    private static ScopeContext ScopeForRun(RunRecord run)
    {
        return new ScopeContext { TenantId = run.TenantId, WorkspaceId = run.WorkspaceId, ProjectId = run.ScopeProjectId };
    }
}
