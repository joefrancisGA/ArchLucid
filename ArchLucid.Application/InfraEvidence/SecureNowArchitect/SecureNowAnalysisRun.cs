using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

/// <summary>
/// Reuses visible, enriched inventory evidence only during an awaited analysis pipeline.
/// AsyncLocal carries the run through diff-consumer fan-out without changing public engine ports.
/// Canonical reads and all mutable path, finding, assertion and rank reads bypass this context.
/// </summary>
internal static class SecureNowAnalysisRun
{
    private static readonly AsyncLocal<RunState?> Current = new();

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
        cancellationToken.ThrowIfCancellationRequested();
        RunState? run = Current.Value;

        if (run is null || !run.Active)
            return await ReadAsync(repository, scope, snapshotId, cancellationToken);

        await run.Gate.WaitAsync(cancellationToken);
        try
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (!run.Active)
                return await ReadAsync(repository, scope, snapshotId, cancellationToken);

            SnapshotKey key = new(scope.TenantId, scope.WorkspaceId, scope.ProjectId, snapshotId);
            Dictionary<SnapshotKey, SecureNowAnalysisSnapshot?> snapshots;
            lock (run.Snapshots)
            {
                if (!run.Snapshots.TryGetValue(repository, out snapshots!))
                {
                    snapshots = [];
                    run.Snapshots.Add(repository, snapshots);
                }
                if (snapshots.TryGetValue(key, out SecureNowAnalysisSnapshot? cached))
                    return cached;
            }

            SecureNowAnalysisSnapshot? loaded = await ReadAsync(repository, scope, snapshotId, cancellationToken);
            // Exceptions and cancelled reads never become cache entries.
            lock (run.Snapshots)
            {
                if (run.Active)
                    snapshots.Add(key, loaded);
            }
            return loaded;
        }
        finally
        {
            run.Gate.Release();
        }
    }

    private static async Task<SecureNowAnalysisSnapshot?> ReadAsync(
        IAzureInventorySnapshotRepository repository,
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken)
    {
        AzureInventorySnapshotDetailReadModel? snapshot =
            await repository.TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);
        cancellationToken.ThrowIfCancellationRequested();
        return snapshot is null ? null : new SecureNowAnalysisSnapshot(snapshot);
    }

    private readonly record struct SnapshotKey(Guid TenantId, Guid WorkspaceId, Guid ProjectId, Guid SnapshotId);

    private sealed class RunState
    {
        public volatile bool Active = true;
        public SemaphoreSlim Gate { get; } = new(1, 1);
        public Dictionary<IAzureInventorySnapshotRepository, Dictionary<SnapshotKey, SecureNowAnalysisSnapshot?>> Snapshots { get; } =
            new(ReferenceEqualityComparer.Instance);
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
            _state.Active = false;
            Current.Value = _previous;
            // No pipeline work outlives its owner. Inherited execution contexts see Active=false.
            lock (_state.Snapshots)
                _state.Snapshots.Clear();
        }
    }

    private sealed class EmptyLease : IDisposable
    {
        public static EmptyLease Instance { get; } = new();
        public void Dispose() { }
    }
}
