using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>In-memory hosts: Azure inventory snapshots are not persisted to SQL.</summary>
public sealed class NoOpAzureInventorySnapshotRepository : IAzureInventorySnapshotRepository
{
    public Task InsertHeaderAsync(AzureInventorySnapshotRecord record, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<AzureInventorySnapshotRecord?> TryGetByPackageIdAsync(
        ScopeContext scope,
        Guid packageId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<AzureInventorySnapshotRecord?>(null);

    public Task<AzureInventorySnapshotRecord?> TryGetBySnapshotIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<AzureInventorySnapshotRecord?>(null);

    public Task<AzureInventorySnapshotDetailReadModel?> TryGetSnapshotDetailAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<AzureInventorySnapshotDetailReadModel?>(null);

    public Task MaterializeSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        AzureInventorySnapshotMaterializeWriteRequest writeRequest,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<Guid?> TryGetPriorMaterializedSnapshotIdAsync(
        ScopeContext scope,
        string subscriptionId,
        Guid newerSnapshotId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<Guid?>(null);
}
