using ArchLucid.Application.InfraEvidence.SecurityDeclaredConnections;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Decorates snapshot detail reads with active human-declared connections (not visible in ARM inventory).
/// </summary>
public sealed class DeclaredConnectionEnrichedAzureInventorySnapshotRepository(
    IAzureInventorySnapshotRepository inner,
    ISecurityDeclaredConnectionRepository declaredConnectionRepository) : IAzureInventorySnapshotRepository
{
    public Task InsertHeaderAsync(AzureInventorySnapshotRecord record, CancellationToken cancellationToken = default) =>
        inner.InsertHeaderAsync(record, cancellationToken);

    public Task<AzureInventorySnapshotRecord?> TryGetByPackageIdAsync(
        ScopeContext scope,
        Guid packageId,
        CancellationToken cancellationToken = default) =>
        inner.TryGetByPackageIdAsync(scope, packageId, cancellationToken);

    public Task<AzureInventorySnapshotRecord?> TryGetBySnapshotIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default) =>
        inner.TryGetBySnapshotIdAsync(scope, snapshotId, cancellationToken);

    public async Task<AzureInventorySnapshotDetailReadModel?> TryGetSnapshotDetailAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        AzureInventorySnapshotDetailReadModel? snapshot =
            await inner.TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);

        if (snapshot is null)
        {
            return null;
        }

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        IReadOnlyList<SecurityDeclaredConnectionRecord> activeConnections =
            await declaredConnectionRepository.ListActiveByTenantAsync(scope.TenantId, utcNow, cancellationToken);

        return SecurityDeclaredConnectionSnapshotMerger.Merge(snapshot, activeConnections, utcNow);
    }

    public Task MaterializeSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        AzureInventorySnapshotMaterializeWriteRequest writeRequest,
        CancellationToken cancellationToken = default) =>
        inner.MaterializeSnapshotAsync(scope, snapshotId, writeRequest, cancellationToken);

    public Task<Guid?> TryGetPriorMaterializedSnapshotIdAsync(
        ScopeContext scope,
        string subscriptionId,
        Guid newerSnapshotId,
        CancellationToken cancellationToken = default) =>
        inner.TryGetPriorMaterializedSnapshotIdAsync(scope, subscriptionId, newerSnapshotId, cancellationToken);

    public Task<(IReadOnlyList<AzureInventorySnapshotRecord> Items, int TotalCount)> ListSnapshotsAsync(
        ScopeContext scope,
        int page,
        int pageSize,
        string? subscriptionId,
        CancellationToken cancellationToken = default) =>
        inner.ListSnapshotsAsync(scope, page, pageSize, subscriptionId, cancellationToken);

    public Task<(IReadOnlyList<AzureInventoryResourceRecord> Items, int TotalCount)?> ListResourcesBySnapshotIdPagedAsync(
        ScopeContext scope,
        Guid snapshotId,
        int page,
        int pageSize,
        Guid? cloudResourceId = null,
        CancellationToken cancellationToken = default) =>
        inner.ListResourcesBySnapshotIdPagedAsync(scope, snapshotId, page, pageSize, cloudResourceId, cancellationToken);
}
