using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class InMemoryRunRepository
{

    public Task<IReadOnlyList<RunRecord>> ListByProjectAsync(ScopeContext scope, string projectId, int take,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        int n = Math.Clamp(take <= 0 ? 20 : take, 1, 200);
        List<RunRecord> list = _store.Values
            .Where(r =>
                RunRepositoryCore.IsActiveInScope(r, scope) &&
                RunRepositoryCore.MatchesProjectListFilter(r, projectId))
            .OrderByDescending(r => r.CreatedUtc)
            .Take(n)
            .ToList();
        return Task.FromResult<IReadOnlyList<RunRecord>>(list);
    }

    public Task<RunListPage> ListByProjectKeysetAsync(
        ScopeContext scope,
        string projectId,
        DateTime? cursorCreatedUtc,
        Guid? cursorRunId,
        int take,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        RunRepositoryCore.ValidateRunKeysetCursor(cursorCreatedUtc, cursorRunId);

        int safeTake = RunPagination.ClampTake(take);
        int fetch = safeTake + 1;

        List<RunRecord> filtered = _store.Values
            .Where(r =>
                RunRepositoryCore.IsActiveInScope(r, scope) &&
                RunRepositoryCore.MatchesProjectListFilter(r, projectId))
            .Where(r =>
                !cursorRunId.HasValue ||
                (r.RunId != cursorRunId.Value
                 && (r.CreatedUtc < cursorCreatedUtc!.Value
                     || (r.CreatedUtc == cursorCreatedUtc.Value && r.RunId < cursorRunId.Value))))
            .OrderByDescending(r => r.CreatedUtc)
            .ThenByDescending(r => r.RunId)
            .Take(fetch)
            .ToList();

        return Task.FromResult(RunListPageAssembler.FromProbedRows(filtered, safeTake));
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<RunRecord>> ListRecentInScopeAsync(ScopeContext scope, int take, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();
        int n = Math.Clamp(take <= 0 ? 200 : take, 1, 200);

        List<RunRecord> list = _store.Values
            .Where(r => RunRepositoryCore.IsActiveInScope(r, scope))
            .OrderByDescending(r => r.CreatedUtc)
            .Take(n)
            .ToList();

        return Task.FromResult<IReadOnlyList<RunRecord>>(list);
    }

    /// <inheritdoc />
    public Task<RunListPage> ListRecentInScopeKeysetAsync(
        ScopeContext scope,
        DateTime? cursorCreatedUtc,
        Guid? cursorRunId,
        int take,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();
        RunRepositoryCore.ValidateRunKeysetCursor(cursorCreatedUtc, cursorRunId);

        int safeTake = RunPagination.ClampTake(take);
        int fetch = safeTake + 1;

        List<RunRecord> filtered = _store.Values
            .Where(r => RunRepositoryCore.IsActiveInScope(r, scope))
            .Where(r =>
                !cursorRunId.HasValue ||
                (r.RunId != cursorRunId.Value
                 && (r.CreatedUtc < cursorCreatedUtc!.Value
                     || (r.CreatedUtc == cursorCreatedUtc.Value && r.RunId < cursorRunId.Value))))
            .OrderByDescending(r => r.CreatedUtc)
            .ThenByDescending(r => r.RunId)
            .Take(fetch)
            .ToList();

        return Task.FromResult(RunListPageAssembler.FromProbedRows(filtered, safeTake));
    }

    /// <inheritdoc />
    public Task<RunListPage> ListRecentInScopeOffsetAsync(
        ScopeContext scope,
        int offset,
        int limit,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();

        int safeLimit = RunPagination.ClampLimit(limit);
        int safeOffset = RunPagination.NormalizeOffset(offset);
        int fetch = safeLimit + 1;

        List<RunRecord> filtered = _store.Values
            .Where(r => RunRepositoryCore.IsActiveInScope(r, scope))
            .OrderByDescending(r => r.CreatedUtc)
            .Skip(safeOffset)
            .Take(fetch)
            .ToList();

        return Task.FromResult(RunListPageAssembler.FromProbedRows(filtered, safeLimit));
    }
}
