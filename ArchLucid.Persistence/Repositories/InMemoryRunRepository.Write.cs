using System.Data;
using System.Globalization;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class InMemoryRunRepository
{

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

        await _saveGate.WaitAsync(ct);
        try
        {
            // SQL uses INSERT and fails on an existing RunId. Do not overwrite a run or
            // debit the trial allowance on duplicate creation attempts.
            if (_store.ContainsKey(run.RunId))
                throw new InvalidOperationException($"Run '{run.RunId:D}' already exists.");

            if (RunRepositoryCore.ShouldConsumeTrialRunAllowanceOnCreate(run))
                await _tenantRepository.TryIncrementActiveTrialRunAsync(run.TenantId, ct, connection, transaction);

            if (_store.Count >= MaxEntries)
            {
                RunRecord? oldest = _store.Values.OrderBy(r => r.CreatedUtc).FirstOrDefault();
                if (oldest is not null)
                    _store.TryRemove(oldest.RunId, out _);
            }

            run.RowVersion = NextFakeRowVersion();
            if (!_store.TryAdd(run.RunId, CopyRunRecord(run)))
                throw new InvalidOperationException($"Run '{run.RunId:D}' already exists.");
        }
        finally
        {
            _saveGate.Release();
        }
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

        lock (existing)
        {
            // A concurrent update can replace the dictionary value while this caller
            // waits to acquire the lock; reject stale writes rather than overwriting it.
            if (!_store.TryGetValue(run.RunId, out RunRecord? current) ||
                !ReferenceEquals(current, existing))
                throw new RunConcurrencyConflictException(run.RunId);

            // SQL UPDATE is bound to the stored tenant/workspace/project identity.
            // A mutable caller record must never move a run into another scope.
            if (existing.TenantId != run.TenantId ||
                existing.WorkspaceId != run.WorkspaceId ||
                existing.ScopeProjectId != run.ScopeProjectId)
                throw new RunConcurrencyConflictException(run.RunId);

            CommittedRunHeaderAnchorGuard.EnsureAnchorsUnchangedIfCommitted(existing, run);

            if (run.RowVersion is not null &&
                existing.RowVersion is not null &&
                !existing.RowVersion.AsSpan().SequenceEqual(run.RowVersion))
                throw new RunConcurrencyConflictException(run.RunId);

            RunRecord replacement = CopyRunRecord(run);
            replacement.RowVersion = NextFakeRowVersion();

            if (!_store.TryUpdate(run.RunId, replacement, existing))
                throw new RunConcurrencyConflictException(run.RunId);

            // Preserve SQL semantics: the caller receives its new concurrency token,
            // but must not retain a reference to the token stored in the dictionary.
            run.RowVersion = replacement.RowVersion!.ToArray();
        }

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

        foreach (Guid id in _store.Keys.ToArray())
        {
            ArchiveTransition transition = TryArchiveCurrentRun(
                id, stamp,
                r => r.CreatedUtc < cutoff &&
                     (scope is null || RunRepositoryCore.MatchesScope(r, scope)),
                unsealedGuard: null,
                ct, out ArchivedRunScopeRow? row);

            if (transition == ArchiveTransition.Archived)
                archived.Add(row!);
        }

        return Task.FromResult(new RunArchiveBatchResult
        {
            UpdatedCount = archived.Count,
            ArchivedRuns = archived
        });
    }

    /// <inheritdoc />
    public Task<RunArchiveByIdsResult> ArchiveRunsByIdsAsync(IReadOnlyList<Guid> runIds, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(runIds);
        ct.ThrowIfCancellationRequested();

        if (runIds.Count == 0)
            return Task.FromResult(new RunArchiveByIdsResult());

        List<Guid> distinctOrdered = RunArchiveByIdsOutcome.DistinctInRequestOrder(runIds);
        DateTime stamp = TimeProvider.System.UtcNowDateTime();
        List<ArchivedRunScopeRow> archived = [];
        List<Guid> alreadyArchivedRunIds = [];

        foreach (Guid id in distinctOrdered)
        {
            ArchiveTransition transition = TryArchiveCurrentRun(
                id, stamp, static _ => true, unsealedGuard: null,
                ct, out ArchivedRunScopeRow? row);

            if (transition == ArchiveTransition.Archived)
                archived.Add(row!);
            else if (transition == ArchiveTransition.AlreadyArchived)
                alreadyArchivedRunIds.Add(id);
        }

        return Task.FromResult(RunArchiveByIdsOutcome.Assemble(
            distinctOrdered, archived, alreadyArchivedRunIds, new RunArchiveChildCascadeCounts()));
    }

    /// <inheritdoc />
    public Task<RunArchiveByIdsResult> ArchiveUnsealedRunAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();

        ArchiveTransition transition = TryArchiveCurrentRun(
            runId, TimeProvider.System.UtcNowDateTime(),
            r => RunRepositoryCore.MatchesScope(r, scope),
            r => !r.GoldenManifestId.HasValue,
            ct, out ArchivedRunScopeRow? row);

        return Task.FromResult(RunArchiveByIdsOutcome.Assemble(
            [runId],
            transition == ArchiveTransition.Archived ? [row!] : [],
            transition == ArchiveTransition.AlreadyArchived ? [runId] : [],
            new RunArchiveChildCascadeCounts()));
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

            if (_store.TryRemove(kv))
                removed.Add(RunRepositoryCore.ToArchivedRunScopeRow(r));
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

            if (_store.TryRemove(kv))
                removed.Add(RunRepositoryCore.ToArchivedRunScopeRow(r));
        }

        return Task.FromResult(new RunSamplePurgeBatchResult { Deleted = removed });
    }

    public Task MarkAuthorityPipelineCommittedAsync(
        ScopeContext scope,
        Guid runId,
        Guid goldenManifestId,
        DateTime completedUtc,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        _ = connection;
        _ = transaction;
        ct.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(scope);

        if (!_store.TryGetValue(runId, out RunRecord? run))
            throw new RunConcurrencyConflictException(runId);

        lock (run)
        {
            if (!RunRepositoryCore.IsActiveInScope(run, scope))
                throw new RunConcurrencyConflictException(runId);

            run.LegacyRunStatus = nameof(ArchitectureRunStatus.Committed);
            run.CompletedUtc ??= completedUtc;

            if (run.GoldenManifestId is null || run.GoldenManifestId == Guid.Empty)
                run.GoldenManifestId = goldenManifestId;
        }

        return Task.CompletedTask;
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
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();

        // Match the SQL repository: reject missing IDs, blank decisions and blank actors
        // before touching a run. Otherwise an invalid decision could be persisted.
        RunRepositoryCore.ValidateOperatorGovernanceDispositionArgs(runId, decision, actorUserId);

        if (!_store.TryGetValue(runId, out RunRecord? run))
            return Task.FromResult(false);

        lock (run)
        {
            if (!RunRepositoryCore.IsActiveInScope(run, scope))
                return Task.FromResult(false);

            // Keep all four disposition fields together against simultaneous updates.
            run.OperatorGovernanceDecision = decision.Trim();
            run.OperatorGovernanceDecisionRationale = rationale;
            run.OperatorGovernanceDecisionUtc = occurredUtc;
            run.OperatorGovernanceDecisionByUserId = actorUserId.Trim();
        }

        return Task.FromResult(true);
    }

    private byte[] NextFakeRowVersion()
    {
        long v = Interlocked.Increment(ref _fakeRowVersion);

        return BitConverter.GetBytes(v);
    }
}
