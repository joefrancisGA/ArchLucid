using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace SecureNow.AnalysisRunCacheBench;

/// <summary>
/// Frozen pre-PR #5498 run-scoped serialized cache. Benchmark only; never used in
/// runtime application analysis. Deliberately retains its global gate and unbounded
/// completed snapshots for an authentic comparison with the previous implementation.
/// </summary>
internal sealed class SerializedRunCacheBaseline
{
    private readonly SemaphoreSlim _gate = new(1, 1);
    private readonly Dictionary<IAzureInventorySnapshotRepository,
        Dictionary<SnapshotKey, SecureNowAnalysisSnapshot?>> _snapshots =
        new(ReferenceEqualityComparer.Instance);

    private readonly record struct SnapshotKey(
        Guid TenantId, Guid WorkspaceId, Guid ProjectId, Guid SnapshotId);

    public async Task<SecureNowAnalysisSnapshot?> LoadAsync(
        IAzureInventorySnapshotRepository repository,
        ScopeContext scope, Guid snapshotId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            SnapshotKey key = new(scope.TenantId, scope.WorkspaceId, scope.ProjectId, snapshotId);
            if (!_snapshots.TryGetValue(repository, out var snapshots))
            {
                snapshots = [];
                _snapshots.Add(repository, snapshots);
            }
            if (snapshots.TryGetValue(key, out SecureNowAnalysisSnapshot? cached))
                return cached;

            AzureInventorySnapshotDetailReadModel? loaded =
                await repository.TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken)
                    .ConfigureAwait(false);
            cancellationToken.ThrowIfCancellationRequested();
            SecureNowAnalysisSnapshot? created = loaded is null
                ? null
                : new SecureNowAnalysisSnapshot(loaded);
            snapshots.Add(key, created);
            return created;
        }
        finally
        {
            _gate.Release();
        }
    }
}
