using System.Data;
using System.Globalization;

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
