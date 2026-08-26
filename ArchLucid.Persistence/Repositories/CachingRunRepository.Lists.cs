using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class CachingRunRepository
{
    /// <summary>Short TTL for dashboard first-page lists; scope revision bump invalidates on writes (TB-578).</summary>
    private const int ListAbsoluteExpirationSeconds = 15;

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

    private async Task<long> ReadRunListScopeRevisionAsync(ScopeContext scope, CancellationToken ct)
    {
        string revisionKey = HotPathCacheKeys.RunListScopeRevision(scope);

        RunListScopeRevisionState? state = await _hotPathReadCache.GetOrCreateAsync(
            revisionKey,
            _ => Task.FromResult<RunListScopeRevisionState?>(new RunListScopeRevisionState { Revision = 0 }),
            ct);

        return state?.Revision ?? 0;
    }
}
