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

        if (TrialRunQuota.ShouldConsumeAllowanceOnCreate(run.IsSample, run.IsDemoWelcomeRun, run.ArchitectureRequestId))
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

        if (!_store.TryGetValue(runId, out RunRecord? r) || !MatchesScope(r, scope) || r.ArchivedUtc.HasValue)
            return Task.FromResult<RunRecord?>(null);

        return Task.FromResult<RunRecord?>(r);
    }

    public Task<RunRecord?> GetByIdIncludingArchivedAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (!_store.TryGetValue(runId, out RunRecord? r) || !MatchesScope(r, scope))
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

        RunRecord? best = null;

        foreach (RunRecord candidate in _store.Values)
        {
            if (!MatchesScope(candidate, scope))
                continue;

            if (candidate.ArchivedUtc.HasValue)
                continue;

            if (!string.Equals(candidate.ProjectId, authorityProjectSlug, StringComparison.Ordinal))
                continue;

            if (!candidate.GraphSnapshotId.HasValue)
                continue;

            if (candidate.CreatedUtc > asOfUtc)
                continue;

            if (best is null
                || candidate.CreatedUtc > best.CreatedUtc
                || (candidate.CreatedUtc == best.CreatedUtc && candidate.RunId.CompareTo(best.RunId) > 0))
                best = candidate;
        }

        return Task.FromResult(best);
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

        Guid? bestRunId = null;
        DateTime? bestUtc = null;

        foreach (RunRecord candidate in _store.Values)
        {
            if (!MatchesScope(candidate, scope))
                continue;

            if (candidate.ArchivedUtc.HasValue)
                continue;

            if (!string.Equals(candidate.ProjectId, projectId, StringComparison.Ordinal))
                continue;

            if (!candidate.GoldenManifestId.HasValue)
                continue;

            if (!IsCommittedRun(candidate))
                continue;

            // In-memory has no GoldenManifests join; CompletedUtc is the commit-time stand-in.
            DateTime orderUtc = candidate.CompletedUtc ?? candidate.CreatedUtc;

            if (bestUtc is not null
                && (orderUtc < bestUtc.Value
                    || (orderUtc == bestUtc.Value && candidate.RunId.CompareTo(bestRunId!.Value) <= 0)))
                continue;

            bestUtc = orderUtc;
            bestRunId = candidate.RunId;
        }

        return Task.FromResult(bestRunId);
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

        RunRecord? best = null;

        foreach (RunRecord candidate in _store.Values)
        {
            if (!MatchesScope(candidate, scope))
                continue;

            if (candidate.ArchivedUtc.HasValue)
                continue;

            if (!string.Equals(candidate.ProjectId, projectId, StringComparison.Ordinal))
                continue;

            if (candidate.RunId == currentRunId)
                continue;

            if (!candidate.GoldenManifestId.HasValue)
                continue;

            if (!IsCommittedRun(candidate))
                continue;

            if (candidate.CreatedUtc > currentCreatedUtc)
                continue;

            if (candidate.CreatedUtc == currentCreatedUtc && candidate.RunId >= currentRunId)
                continue;

            if (best is not null)
            {
                if (candidate.CreatedUtc < best.CreatedUtc)
                    continue;

                if (candidate.CreatedUtc == best.CreatedUtc && candidate.RunId <= best.RunId)
                    continue;
            }

            best = candidate;
        }

        return Task.FromResult(best?.RunId);
    }

    private static bool IsCommittedRun(RunRecord run)
    {
        if (string.Equals(run.LegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            return true;

        if (!string.IsNullOrWhiteSpace(run.CurrentManifestVersion))
            return true;

        return run.GoldenManifestId.HasValue;
    }

    public Task<IReadOnlyList<RunRecord>> ListByProjectAsync(ScopeContext scope, string projectId, int take,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        int n = Math.Clamp(take <= 0 ? 20 : take, 1, 200);
        List<RunRecord> list = _store.Values
            .Where(r =>
                MatchesScope(r, scope) &&
                !r.ArchivedUtc.HasValue &&
                string.Equals(r.ProjectId, projectId, StringComparison.Ordinal))
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
        ValidateRunKeysetCursor(cursorCreatedUtc, cursorRunId);

        int safeTake = RunPagination.ClampTake(take);
        int fetch = safeTake + 1;

        List<RunRecord> filtered = _store.Values
            .Where(r =>
                MatchesScope(r, scope) &&
                !r.ArchivedUtc.HasValue &&
                string.Equals(r.ProjectId, projectId, StringComparison.Ordinal))
            .Where(r =>
                !cursorRunId.HasValue ||
                (r.RunId != cursorRunId.Value
                 && (r.CreatedUtc < cursorCreatedUtc!.Value
                     || (r.CreatedUtc == cursorCreatedUtc.Value && r.RunId < cursorRunId.Value))))
            .OrderByDescending(r => r.CreatedUtc)
            .ThenByDescending(r => r.RunId)
            .Take(fetch)
            .ToList();

        bool hasMore = filtered.Count > safeTake;

        if (hasMore)

            filtered.RemoveAt(filtered.Count - 1);

        return Task.FromResult(new RunListPage(filtered, hasMore));
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<RunRecord>> ListRecentInScopeAsync(ScopeContext scope, int take, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();
        int n = Math.Clamp(take <= 0 ? 200 : take, 1, 200);

        List<RunRecord> list = _store.Values
            .Where(r =>
                MatchesScope(r, scope) &&
                !r.ArchivedUtc.HasValue)
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
        ValidateRunKeysetCursor(cursorCreatedUtc, cursorRunId);

        int safeTake = RunPagination.ClampTake(take);
        int fetch = safeTake + 1;

        List<RunRecord> filtered = _store.Values
            .Where(r =>
                MatchesScope(r, scope) &&
                !r.ArchivedUtc.HasValue)
            .Where(r =>
                !cursorRunId.HasValue ||
                (r.RunId != cursorRunId.Value
                 && (r.CreatedUtc < cursorCreatedUtc!.Value
                     || (r.CreatedUtc == cursorCreatedUtc.Value && r.RunId < cursorRunId.Value))))
            .OrderByDescending(r => r.CreatedUtc)
            .ThenByDescending(r => r.RunId)
            .Take(fetch)
            .ToList();

        bool hasMore = filtered.Count > safeTake;

        if (hasMore)

            filtered.RemoveAt(filtered.Count - 1);

        return Task.FromResult(new RunListPage(filtered, hasMore));
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
            .Where(r =>
                MatchesScope(r, scope) &&
                !r.ArchivedUtc.HasValue)
            .OrderByDescending(r => r.CreatedUtc)
            .Skip(safeOffset)
            .Take(fetch)
            .ToList();

        bool hasMore = filtered.Count > safeLimit;

        if (hasMore)

            filtered.RemoveAt(filtered.Count - 1);

        return Task.FromResult(new RunListPage(filtered, hasMore));
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
    public Task<RunArchiveBatchResult> ArchiveRunsCreatedBeforeAsync(DateTimeOffset cutoffUtc, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        DateTime cutoff = cutoffUtc.UtcDateTime;
        DateTime stamp = TimeProvider.System.UtcNowDateTime();
        List<ArchivedRunScopeRow> archived = [];

        foreach (KeyValuePair<Guid, RunRecord> kv in _store.ToArray())
        {
            RunRecord r = kv.Value;

            if (r.ArchivedUtc.HasValue || r.CreatedUtc >= cutoff)
                continue;

            archived.Add(new ArchivedRunScopeRow { RunId = r.RunId, TenantId = r.TenantId, WorkspaceId = r.WorkspaceId, ScopeProjectId = r.ScopeProjectId });

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

        List<Guid> distinctOrdered = [];
        HashSet<Guid> seen = [];

        distinctOrdered.AddRange(runIds.Where(seen.Add));

        DateTime stamp = TimeProvider.System.UtcNowDateTime();
        List<ArchivedRunScopeRow> archived = [];
        List<RunArchiveByIdFailure> failed = [];

        foreach (Guid id in distinctOrdered)
        {
            if (!_store.TryGetValue(id, out RunRecord? run))
            {
                failed.Add(new RunArchiveByIdFailure(id, "Run not found."));
                continue;
            }

            if (run.ArchivedUtc.HasValue)
            {
                failed.Add(new RunArchiveByIdFailure(id, "Run already archived."));
                continue;
            }

            archived.Add(new ArchivedRunScopeRow
            {
                RunId = run.RunId,
                TenantId = run.TenantId,
                WorkspaceId = run.WorkspaceId,
                ScopeProjectId = run.ScopeProjectId
            });

            run.ArchivedUtc = stamp;
            _store[id] = run;
        }

        return Task.FromResult(new RunArchiveByIdsResult
        {
            SucceededRunIds = archived.Select(static r => r.RunId).ToList(),
            ArchivedRuns = archived,
            Failed = failed
        });
    }

    /// <inheritdoc />
    public Task<int> CountActiveRunsForArchitectureRequestAsync(
        ScopeContext scope,
        string architectureRequestId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(architectureRequestId))
            throw new ArgumentException("Architecture request id is required.", nameof(architectureRequestId));

        string key = architectureRequestId.Trim();

        List<RunRecord> matches =
        [
            .. _store.Values.Where(r =>
                MatchesScope(r, scope) &&
                !r.ArchivedUtc.HasValue &&
                string.Equals(r.ArchitectureRequestId, key, StringComparison.OrdinalIgnoreCase)),
        ];

        return Task.FromResult(matches.Count(r => LegacyRunStatusIsNonTerminal(r.LegacyRunStatus)));
    }

    /// <inheritdoc />
    public Task<bool> ExistsRunForArchitectureRequestInScopeAsync(
        ScopeContext scope,
        string architectureRequestId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(architectureRequestId))
            throw new ArgumentException("Architecture request id is required.", nameof(architectureRequestId));

        string key = architectureRequestId.Trim();

        bool exists = _store.Values.Any(r =>
            MatchesScope(r, scope) &&
            string.Equals(r.ArchitectureRequestId, key, StringComparison.OrdinalIgnoreCase));

        return Task.FromResult(exists);
    }

    /// <inheritdoc />
    public Task<RunStaleUncommittedPurgeBatchResult> HardDeleteStaleUncommittedRunsBatchAsync(
        DateTimeOffset createdBeforeUtc,
        int batchSize,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (batchSize < 1)
            throw new ArgumentOutOfRangeException(nameof(batchSize), batchSize, "Batch size must be at least 1.");

        DateTime cutoff = createdBeforeUtc.UtcDateTime;
        int cap = Math.Clamp(batchSize, 1, 10_000);
        List<ArchivedRunScopeRow> removed = [];

        foreach (KeyValuePair<Guid, RunRecord> kv in _store.OrderBy(static p => p.Value.CreatedUtc).ToArray())
        {
            if (removed.Count >= cap)
                break;

            RunRecord r = kv.Value;

            if (r.CreatedUtc >= cutoff)
                continue;

            if (r.IsDemoWelcomeRun || r.IsPublicShowcase)
                continue;

            if (!string.IsNullOrWhiteSpace(r.LegacyRunStatus) &&
                string.Equals(r.LegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
                continue;

            removed.Add(new ArchivedRunScopeRow
            {
                RunId = r.RunId,
                TenantId = r.TenantId,
                WorkspaceId = r.WorkspaceId,
                ScopeProjectId = r.ScopeProjectId
            });

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

        if (batchSize < 1)
            throw new ArgumentOutOfRangeException(nameof(batchSize), batchSize, "Batch size must be at least 1.");

        DateTime? cutoff = createdBeforeUtc?.UtcDateTime;
        int cap = Math.Clamp(batchSize, 1, 10_000);
        List<ArchivedRunScopeRow> removed = [];

        foreach (KeyValuePair<Guid, RunRecord> kv in _store.OrderBy(static p => p.Value.CreatedUtc).ToArray())
        {
            if (removed.Count >= cap)
                break;

            RunRecord r = kv.Value;

            if (!r.IsSample)
                continue;

            if (tenantId.HasValue && r.TenantId != tenantId.Value)
                continue;

            if (cutoff.HasValue && r.CreatedUtc >= cutoff.Value)
                continue;

            removed.Add(new ArchivedRunScopeRow
            {
                RunId = r.RunId,
                TenantId = r.TenantId,
                WorkspaceId = r.WorkspaceId,
                ScopeProjectId = r.ScopeProjectId
            });

            _store.TryRemove(kv.Key, out _);
        }

        return Task.FromResult(new RunSamplePurgeBatchResult { Deleted = removed });
    }

    private static bool LegacyRunStatusIsNonTerminal(string? legacyRunStatus)
    {
        // Null/empty statuses are treated as active — safer than falsely releasing lifecycle while status is uninitialized.

        if (string.IsNullOrWhiteSpace(legacyRunStatus))
            return true;

        if (string.Equals(legacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            return false;

        if (string.Equals(legacyRunStatus, nameof(ArchitectureRunStatus.Failed), StringComparison.OrdinalIgnoreCase))
            return false;

        return !string.Equals(legacyRunStatus, nameof(ArchitectureRunStatus.ExecutionCompletedQualityRejected), StringComparison.OrdinalIgnoreCase);
    }

    private static void ValidateRunKeysetCursor(DateTime? cursorCreatedUtc, Guid? cursorRunId)
    {
        if (cursorCreatedUtc.HasValue != cursorRunId.HasValue)
            throw new ArgumentException(
                "Run keyset cursor requires both CreatedUtc and RunId together, or both omitted for the first page.");
    }

    private static bool MatchesScope(RunRecord r, ScopeContext scope)
    {
        return r.TenantId == scope.TenantId &&
               r.WorkspaceId == scope.WorkspaceId &&
               r.ScopeProjectId == scope.ProjectId;
    }

    private byte[] NextFakeRowVersion()
    {
        long v = Interlocked.Increment(ref _fakeRowVersion);

        return BitConverter.GetBytes(v);
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

        if (!_store.TryGetValue(runId, out RunRecord? run) || !MatchesScope(run, scope) || run.ArchivedUtc.HasValue)
            return Task.FromResult(false);

        run.OperatorGovernanceDecision = decision.Trim();
        run.OperatorGovernanceDecisionRationale = rationale;
        run.OperatorGovernanceDecisionUtc = occurredUtc;
        run.OperatorGovernanceDecisionByUserId = actorUserId.Trim();

        return Task.FromResult(true);
    }
}
