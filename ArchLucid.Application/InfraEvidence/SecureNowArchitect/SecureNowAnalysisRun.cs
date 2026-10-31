using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

/// <summary>
/// Run-local reuse of enriched snapshot evidence. Only identical repository/scope/snapshot
/// reads coalesce; unrelated keys can load concurrently. Canonical and mutable evidence
/// reads never use this cache. All retained data is released with its owning run.
/// </summary>
internal static class SecureNowAnalysisRun
{
    private static readonly AsyncLocal<RunState?> Current = new();

    // Conservative retention controls, not calibrated CLR heap-size limits.
    internal const int MaxRetainedSnapshots = 8;
    internal const int MaxTrackedKeys = 16;
    internal const int MaxConcurrentSnapshotLoads = 4;
    internal const long MaxRetainedEstimatedBytes = 16L * 1024 * 1024;
    internal const long MaxSingleEstimatedBytes = 8L * 1024 * 1024;

    public static IDisposable Begin() => new RunLease();

    public static IDisposable JoinOrBegin() => Current.Value is { Active: true }
        ? EmptyLease.Instance
        : Begin();

    public static async Task<SecureNowAnalysisSnapshot?> LoadAsync(
        IAzureInventorySnapshotRepository repository,
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(repository);
        ArgumentNullException.ThrowIfNull(scope);
        cancellationToken.ThrowIfCancellationRequested();

        RunState? run = Current.Value;
        if (run is null || !run.Active)
            return await ReadAsync(repository, scope, snapshotId, cancellationToken).ConfigureAwait(false);

        SnapshotKey key = new(scope.TenantId, scope.WorkspaceId, scope.ProjectId, snapshotId);
        CacheEntry? entry = null;
        bool leader = false;
        bool bypass = false;

        lock (run.Sync)
        {
            if (!run.Active)
            {
                bypass = true;
            }
            else if (run.Entries.TryGetValue(repository, out var entries) &&
                     entries.TryGetValue(key, out entry))
            {
                run.Touch(entry);
            }
            else
            {
                // Evict completed entries first. In-flight entries are never evicted or
                // replaced, preventing two simultaneous reads for the same tracked key.
                while (run.TrackedCount >= MaxTrackedKeys && run.Lru.First is not null)
                    run.EvictOldest();

                if (run.TrackedCount >= MaxTrackedKeys)
                {
                    // Fail open to the authoritative repository, but still observe the
                    // run's global read-concurrency limit. Do not retain extra entries.
                    bypass = true;
                }
                else
                {
                    entries ??= new Dictionary<SnapshotKey, CacheEntry>();
                    run.Entries[repository] = entries;
                    entry = new CacheEntry(repository, key);
                    entries.Add(key, entry);
                    run.TrackedCount++;
                    leader = true;
                }
            }
        }

        // ScopeContext is mutable. Freeze the identity actually used for both
        // the cache lookup and underlying repository authorization scope.
        ScopeContext scopedRead = new()
        {
            TenantId = key.TenantId,
            WorkspaceId = key.WorkspaceId,
            ProjectId = key.ProjectId,
        };

        if (bypass)
            return await ReadWithLimitAsync(run, repository, scopedRead, snapshotId, cancellationToken)
                .ConfigureAwait(false);

        if (leader)
            _ = LoadAndPublishAsync(run, entry!, repository, scopedRead, snapshotId);

        // Canceling one waiter cannot cancel the shared read needed by other waiters.
        return await entry!.Completion.Task.WaitAsync(cancellationToken).ConfigureAwait(false);
    }

    private static async Task LoadAndPublishAsync(
        RunState run,
        CacheEntry entry,
        IAzureInventorySnapshotRepository repository,
        ScopeContext scope,
        Guid snapshotId)
    {
        try
        {
            SecureNowAnalysisSnapshot? loaded = await ReadWithLimitAsync(
                run, repository, scope, snapshotId, run.Stop.Token).ConfigureAwait(false);

            long bytes = EstimateRetainedBytes(loaded);
            lock (run.Sync)
            {
                if (run.Active && bytes <= MaxSingleEstimatedBytes &&
                    run.Contains(entry))
                {
                    entry.EstimatedBytes = bytes;
                    entry.Node = run.Lru.AddLast(entry);
                    run.RetainedEstimatedBytes += bytes;
                    while (run.Lru.Count > MaxRetainedSnapshots ||
                           run.RetainedEstimatedBytes > MaxRetainedEstimatedBytes)
                        run.EvictOldest();
                }
                else
                {
                    run.Remove(entry);
                }
            }
            entry.Completion.TrySetResult(loaded);
        }
        catch (OperationCanceledException ex)
        {
            lock (run.Sync)
                run.Remove(entry);
            entry.Completion.TrySetCanceled(ex.CancellationToken);
        }
        catch (Exception ex)
        {
            lock (run.Sync)
                run.Remove(entry);
            entry.Completion.TrySetException(ex);
        }
    }

    private static async Task<SecureNowAnalysisSnapshot?> ReadWithLimitAsync(
        RunState run,
        IAzureInventorySnapshotRepository repository,
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken)
    {
        using CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(
            run.Stop.Token, cancellationToken);
        await run.ReadSlots.WaitAsync(linked.Token).ConfigureAwait(false);
        try
        {
            return await ReadAsync(repository, scope, snapshotId, linked.Token).ConfigureAwait(false);
        }
        finally
        {
            run.ReadSlots.Release();
        }
    }

    private static async Task<SecureNowAnalysisSnapshot?> ReadAsync(
        IAzureInventorySnapshotRepository repository,
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken)
    {
        AzureInventorySnapshotDetailReadModel? snapshot =
            await repository.TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken)
                .ConfigureAwait(false);
        cancellationToken.ThrowIfCancellationRequested();
        return snapshot is null ? null : new SecureNowAnalysisSnapshot(snapshot);
    }

    /// <summary>
    /// Deliberately conservative row-count proxy. Large strings, object graph overhead,
    /// lazily built indexes and concurrent in-flight reads are not exact heap accounting.
    /// </summary>
    private static long EstimateRetainedBytes(SecureNowAnalysisSnapshot? value)
    {
        if (value is null)
            return 1024;

        var s = value.Snapshot;
        long rows = (long)s.Resources.Count + s.Properties.Count + s.Tags.Count +
            s.Relationships.Count + s.AdfExternalSources.Count + s.RoleAssignments.Count +
            s.Diagnostics.Count + s.DefenderSummaries.Count + s.DefenderPricings.Count +
            s.DefenderScoreControls.Count + s.DefenderAssessments.Count +
            s.DefenderAssessmentCounts.Count + s.DefenderSecurityContacts.Count +
            s.DefenderGovernanceAssignments.Count + s.DefenderComplianceStandards.Count +
            s.DefenderComplianceControls.Count + s.DefenderAlerts.Count +
            s.DefenderAttackPaths.Count + s.DefenderVulnerabilityCounts.Count +
            s.DefenderVulnerabilityFindings.Count;

        return checked(1024L + rows * 512L);
    }

    private readonly record struct SnapshotKey(Guid TenantId, Guid WorkspaceId, Guid ProjectId, Guid SnapshotId);

    private sealed class CacheEntry(
        IAzureInventorySnapshotRepository repository, SnapshotKey key)
    {
        public IAzureInventorySnapshotRepository Repository { get; } = repository;
        public SnapshotKey Key { get; } = key;
        public TaskCompletionSource<SecureNowAnalysisSnapshot?> Completion { get; } =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        public LinkedListNode<CacheEntry>? Node { get; set; }
        public long EstimatedBytes { get; set; }
    }

    private sealed class RunState
    {
        public volatile bool Active = true;
        public object Sync { get; } = new();
        public CancellationTokenSource Stop { get; } = new();
        public SemaphoreSlim ReadSlots { get; } = new(MaxConcurrentSnapshotLoads, MaxConcurrentSnapshotLoads);
        public Dictionary<IAzureInventorySnapshotRepository, Dictionary<SnapshotKey, CacheEntry>> Entries { get; } =
            new(ReferenceEqualityComparer.Instance);
        public LinkedList<CacheEntry> Lru { get; } = new();
        public int TrackedCount { get; set; }
        public long RetainedEstimatedBytes { get; set; }

        public bool Contains(CacheEntry entry) =>
            Entries.TryGetValue(entry.Repository, out var entries) &&
            entries.TryGetValue(entry.Key, out CacheEntry? existing) &&
            ReferenceEquals(existing, entry);

        public void Touch(CacheEntry entry)
        {
            if (entry.Node is null)
                return;
            Lru.Remove(entry.Node);
            entry.Node = Lru.AddLast(entry);
        }

        public void EvictOldest()
        {
            if (Lru.First is { Value: CacheEntry entry })
                Remove(entry);
        }

        public void Remove(CacheEntry entry)
        {
            if (!Contains(entry))
                return;
            Entries[entry.Repository].Remove(entry.Key);
            if (Entries[entry.Repository].Count == 0)
                Entries.Remove(entry.Repository);
            TrackedCount--;
            if (entry.Node is not null)
            {
                Lru.Remove(entry.Node);
                entry.Node = null;
                RetainedEstimatedBytes -= entry.EstimatedBytes;
            }
        }

        public void Clear()
        {
            Entries.Clear();
            Lru.Clear();
            TrackedCount = 0;
            RetainedEstimatedBytes = 0;
        }
    }

    private sealed class RunLease : IDisposable
    {
        private readonly RunState? _previous = Current.Value;
        private readonly RunState _state = new();
        private bool _disposed;

        public RunLease() => Current.Value = _state;

        public void Dispose()
        {
            if (_disposed)
                return;
            _disposed = true;
            lock (_state.Sync)
            {
                _state.Active = false;
                _state.Clear();
            }
            Current.Value = _previous;
            // Ongoing reads observe cancellation even when their repository
            // ignores it initially. Do not dispose primitives under live tasks.
            _state.Stop.Cancel();
        }
    }

    private sealed class EmptyLease : IDisposable
    {
        public static EmptyLease Instance { get; } = new();
        public void Dispose() { }
    }
}
