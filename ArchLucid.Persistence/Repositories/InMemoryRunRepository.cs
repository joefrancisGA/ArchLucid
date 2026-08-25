using System.Collections.Concurrent;
using System.Data;
using System.Globalization;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     In-memory implementation of <see cref="IRunRepository" /> for testing and local development.
///     Capped at <see cref="MaxEntries" /> entries; when full, the oldest run (by <c>CreatedUtc</c>) is
///     evicted on each new insert to prevent unbounded growth.
///     All reads are filtered to the caller's tenant, workspace, and project scope.
/// </summary>
public sealed class InMemoryRunRepository(ITenantRepository? tenantRepository = null) : IRunRepository
{
    private const int MaxEntries = 2_000;

    private readonly ConcurrentDictionary<Guid, RunRecord> _store = new();

    private readonly ITenantRepository _tenantRepository = tenantRepository ?? new InMemoryTenantRepository();

    private long _fakeRowVersion;

    public async Task SaveAsync(
        RunRecord run,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(run);
        ct.ThrowIfCancellationRequested();
        _ = connection;
        _ = transaction;

        if (RunRepositoryCore.ShouldConsumeTrialRunAllowanceOnCreate(run))
            await _tenantRepository.TryIncrementActiveTrialRunAsync(run.TenantId, ct, connection, transaction);

        if (_store.Count >= MaxEntries && !_store.ContainsKey(run.RunId))
        {
            RunRecord? oldest = _store.Values.OrderBy(r => r.CreatedUtc).FirstOrDefault();

            if (oldest is not null)
                _store.TryRemove(oldest.RunId, out _);
        }

        run.RowVersion = NextFakeRowVersion();
        _store[run.RunId] = run;
    }

    public Task<RunRecord?> GetByIdAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (!_store.TryGetValue(runId, out RunRecord? r) || !RunRepositoryCore.IsActiveInScope(r, scope))
            return Task.FromResult<RunRecord?>(null);

        return Task.FromResult<RunRecord?>(r);
    }

    public Task<RunRecord?> GetByIdIncludingArchivedAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (!_store.TryGetValue(runId, out RunRecord? r) || !RunRepositoryCore.MatchesScope(r, scope))
            return Task.FromResult<RunRecord?>(null);

        return Task.FromResult<RunRecord?>(r);
    }

    public Task<RunRecord?> GetByRunIdAdminAsync(Guid runId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (!_store.TryGetValue(runId, out RunRecord? r) || r.ArchivedUtc.HasValue)
            return Task.FromResult<RunRecord?>(null);

        return Task.FromResult<RunRecord?>(r);
    }

    public Task<RunRecord?> GetLatestWithGraphAtOrBeforeAsync(
        ScopeContext scope,
        string authorityProjectSlug,
        DateTime asOfUtc,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        return Task.FromResult(
            RunRepositoryCore.SelectLatestWithGraphAtOrBefore(_store.Values, scope, authorityProjectSlug, asOfUtc));
    }

    /// <inheritdoc />
    public Task<Guid?> GetLatestCommittedRunIdByManifestCreatedUtcAsync(
        ScopeContext scope,
        string projectId,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(projectId);

        return Task.FromResult(
            RunRepositoryCore.SelectLatestCommittedRunIdByManifestCreatedUtc(_store.Values, scope, projectId));
    }

    /// <inheritdoc />
    public Task<Guid?> GetPriorCommittedRunIdBeforeCurrentAsync(
        ScopeContext scope,
        string projectId,
        Guid currentRunId,
        DateTime currentCreatedUtc,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(projectId);

        return Task.FromResult(
            RunRepositoryCore.SelectPriorCommittedRunIdBeforeCurrent(
                _store.Values,
                scope,
                projectId,
                currentRunId,
                currentCreatedUtc));
    }

    public Task<Guid?> GetPriorCommittedRunIdForArchitectureBeforeCurrentAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid currentRunId,
        DateTime currentCreatedUtc,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(scope);

        return Task.FromResult(
            RunRepositoryCore.SelectPriorCommittedRunIdForArchitectureBeforeCurrent(
                _store.Values,
                scope,
                architectureId,
                currentRunId,
                currentCreatedUtc));
    }

    public Task<Guid?> GetCommittedRunIdByGoldenManifestIdAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid goldenManifestId,
        Guid excludeRunId,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(scope);

        return Task.FromResult(
            RunRepositoryCore.SelectCommittedRunIdByGoldenManifestId(
                _store.Values,
                scope,
                architectureId,
                goldenManifestId,
                excludeRunId));
    }

    public Task ClearGraphSnapshotForArchitectureAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(scope);

        if (architectureId == Guid.Empty)
            return Task.CompletedTask;

        foreach (RunRecord candidate in _store.Values)
        {
            if (!RunRepositoryCore.IsActiveInScope(candidate, scope))
                continue;

            if (candidate.ArchitectureId != architectureId)
                continue;

            candidate.GraphSnapshotId = null;
        }

        return Task.CompletedTask;
    }

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

    public Task UpdateAsync(
        RunRecord run,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(run);
        ct.ThrowIfCancellationRequested();
        _ = connection;
        _ = transaction;

        if (!_store.TryGetValue(run.RunId, out RunRecord? existing))
            throw new InvalidOperationException(
                string.Format(CultureInfo.InvariantCulture, "Run '{0:D}' was not found for update.", run.RunId));

        CommittedRunHeaderAnchorGuard.EnsureAnchorsUnchangedIfCommitted(existing, run);

        if (run.RowVersion is not null &&
            existing.RowVersion is not null &&
            !existing.RowVersion.AsSpan().SequenceEqual(run.RowVersion))
            throw new RunConcurrencyConflictException(run.RunId);

        run.RowVersion = NextFakeRowVersion();
        _store[run.RunId] = run;
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<RunArchiveBatchResult> ArchiveRunsCreatedBeforeAsync(DateTimeOffset cutoffUtc, CancellationToken ct) =>
        ArchiveRunsCreatedBeforeCoreAsync(cutoffUtc, scope: null, ct);

    /// <inheritdoc />
    public Task<RunArchiveBatchResult> ArchiveRunsCreatedBeforeForScopeAsync(
        ScopeContext scope,
        DateTimeOffset cutoffUtc,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return ArchiveRunsCreatedBeforeCoreAsync(cutoffUtc, scope, ct);
    }

    private Task<RunArchiveBatchResult> ArchiveRunsCreatedBeforeCoreAsync(
        DateTimeOffset cutoffUtc,
        ScopeContext? scope,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        DateTime cutoff = cutoffUtc.UtcDateTime;
        DateTime stamp = TimeProvider.System.UtcNowDateTime();
        List<ArchivedRunScopeRow> archived = [];

        foreach (KeyValuePair<Guid, RunRecord> kv in _store.ToArray())
        {
            RunRecord r = kv.Value;

            if (!RunRepositoryCore.IsEligibleForCreatedBeforeArchive(r, cutoff, scope))
                continue;

            archived.Add(RunRepositoryCore.ToArchivedRunScopeRow(r));

            r.ArchivedUtc = stamp;
            _store[kv.Key] = r;
        }

        return Task.FromResult(new RunArchiveBatchResult { UpdatedCount = archived.Count, ArchivedRuns = archived });
    }

    /// <inheritdoc />
    public Task<RunArchiveByIdsResult> ArchiveRunsByIdsAsync(IReadOnlyList<Guid> runIds, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (runIds.Count == 0)
            return Task.FromResult(new RunArchiveByIdsResult());

        List<Guid> distinctOrdered = RunArchiveByIdsOutcome.DistinctInRequestOrder(runIds);
        DateTime stamp = TimeProvider.System.UtcNowDateTime();
        List<ArchivedRunScopeRow> archived = [];
        List<Guid> alreadyArchivedRunIds = [];

        foreach (Guid id in distinctOrdered)
        {
            if (!_store.TryGetValue(id, out RunRecord? run))
                continue;

            if (run.ArchivedUtc.HasValue)
            {
                alreadyArchivedRunIds.Add(id);
                continue;
            }

            archived.Add(RunRepositoryCore.ToArchivedRunScopeRow(run));

            run.ArchivedUtc = stamp;
            _store[id] = run;
        }

        return Task.FromResult(
            RunArchiveByIdsOutcome.Assemble(distinctOrdered, archived, alreadyArchivedRunIds, new RunArchiveChildCascadeCounts()));
    }

    /// <inheritdoc />
    public Task<int> CountActiveRunsForArchitectureRequestAsync(
        ScopeContext scope,
        string architectureRequestId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();

        string key = RunRepositoryCore.RequireArchitectureRequestId(architectureRequestId);

        List<RunRecord> matches =
        [
            .. _store.Values.Where(r =>
                RunRepositoryCore.IsActiveInScope(r, scope) &&
                string.Equals(r.ArchitectureRequestId, key, StringComparison.OrdinalIgnoreCase)),
        ];

        return Task.FromResult(matches.Count(r => RunRepositoryCore.LegacyRunStatusIsNonTerminal(r.LegacyRunStatus)));
    }

    /// <inheritdoc />
    public Task<bool> ExistsRunForArchitectureRequestInScopeAsync(
        ScopeContext scope,
        string architectureRequestId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();

        string key = RunRepositoryCore.RequireArchitectureRequestId(architectureRequestId);

        bool exists = _store.Values.Any(r =>
            RunRepositoryCore.MatchesScope(r, scope) &&
            string.Equals(r.ArchitectureRequestId, key, StringComparison.OrdinalIgnoreCase));

        return Task.FromResult(exists);
    }

    /// <inheritdoc />
    public Task<bool> ExistsActiveRunWithSystemNameInWorkspaceAsync(
        ScopeContext scope,
        string systemName,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();

        string normalizedName = RunRepositoryCore.RequireSystemName(systemName).ToUpperInvariant();

        bool exists = _store.Values.Any(r =>
            RunRepositoryCore.MatchesWorkspace(r, scope) &&
            !r.ArchivedUtc.HasValue &&
            string.Equals(r.ProjectId.Trim(), normalizedName, StringComparison.OrdinalIgnoreCase));

        return Task.FromResult(exists);
    }

    /// <inheritdoc />
    public Task<RunStaleUncommittedPurgeBatchResult> HardDeleteStaleUncommittedRunsBatchAsync(
        DateTimeOffset createdBeforeUtc,
        int batchSize,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        DateTime cutoff = createdBeforeUtc.UtcDateTime;
        int cap = RunRepositoryCore.ClampPurgeBatchSize(batchSize);
        List<ArchivedRunScopeRow> removed = [];

        foreach (KeyValuePair<Guid, RunRecord> kv in _store.OrderBy(static p => p.Value.CreatedUtc).ToArray())
        {
            if (removed.Count >= cap)
                break;

            RunRecord r = kv.Value;

            if (!RunRepositoryCore.IsEligibleForStaleUncommittedPurge(r, cutoff))
                continue;

            removed.Add(RunRepositoryCore.ToArchivedRunScopeRow(r));
            _store.TryRemove(kv.Key, out _);
        }

        return Task.FromResult(new RunStaleUncommittedPurgeBatchResult { Deleted = removed });
    }

    /// <inheritdoc />
    public Task<RunSamplePurgeBatchResult> HardDeleteSampleRunsBatchAsync(
        Guid? tenantId,
        DateTimeOffset? createdBeforeUtc,
        int batchSize,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        DateTime? cutoff = createdBeforeUtc?.UtcDateTime;
        int cap = RunRepositoryCore.ClampPurgeBatchSize(batchSize);
        List<ArchivedRunScopeRow> removed = [];

        foreach (KeyValuePair<Guid, RunRecord> kv in _store.OrderBy(static p => p.Value.CreatedUtc).ToArray())
        {
            if (removed.Count >= cap)
                break;

            RunRecord r = kv.Value;

            if (!RunRepositoryCore.IsEligibleForSamplePurge(r, tenantId, cutoff))
                continue;

            removed.Add(RunRepositoryCore.ToArchivedRunScopeRow(r));
            _store.TryRemove(kv.Key, out _);
        }

        return Task.FromResult(new RunSamplePurgeBatchResult { Deleted = removed });
    }

    public Task<bool> TrySetOperatorGovernanceDispositionAsync(
        ScopeContext scope,
        Guid runId,
        string decision,
        string? rationale,
        string actorUserId,
        DateTime occurredUtc,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (!_store.TryGetValue(runId, out RunRecord? run) || !RunRepositoryCore.IsActiveInScope(run, scope))
            return Task.FromResult(false);

        run.OperatorGovernanceDecision = decision.Trim();
        run.OperatorGovernanceDecisionRationale = rationale;
        run.OperatorGovernanceDecisionUtc = occurredUtc;
        run.OperatorGovernanceDecisionByUserId = actorUserId.Trim();

        return Task.FromResult(true);
    }

    private byte[] NextFakeRowVersion()
    {
        long v = Interlocked.Increment(ref _fakeRowVersion);

        return BitConverter.GetBytes(v);
    }
}
