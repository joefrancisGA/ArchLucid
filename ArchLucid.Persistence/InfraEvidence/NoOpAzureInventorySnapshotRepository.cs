using ArchLucid.Core.InfraEvidence;
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

    public Task<AzureInventorySnapshotDetailReadModel?> TryGetCanonicalSnapshotDetailAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default) =>
        TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);

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

    public Task<(IReadOnlyList<AzureInventorySnapshotRecord> Items, int TotalCount)> ListSnapshotsAsync(
        ScopeContext scope,
        int page,
        int pageSize,
        string? subscriptionId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<(IReadOnlyList<AzureInventorySnapshotRecord>, int)>(([], 0));

    public Task<(IReadOnlyList<AzureInventoryResourceRecord> Items, int TotalCount)?> ListResourcesBySnapshotIdPagedAsync(
        ScopeContext scope,
        Guid snapshotId,
        int page,
        int pageSize,
        Guid? cloudResourceId = null,
        CancellationToken cancellationToken = default)
        => Task.FromResult<(IReadOnlyList<AzureInventoryResourceRecord>, int)?>(null);

    public Task<IReadOnlyList<AzureInventoryResourceRecord>?> ListResourcesBySnapshotIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<AzureInventoryResourceRecord>?>(null);

    public Task<AzureInventorySnapshotDeleteResult> TryDeleteSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
        => Task.FromResult(new AzureInventorySnapshotDeleteResult
        {
            Outcome = AzureInventorySnapshotDeleteOutcome.NotFound,
        });

    public Task<IReadOnlyList<AzureInventoryResourcePropertyReadModel>> ListResourcePropertiesByResourceRowIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        Guid resourceRowId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AzureInventoryResourcePropertyReadModel>>([]);

    public Task<IReadOnlyList<AzureInventoryTagReadModel>> ListResourceTagsByResourceRowIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        Guid resourceRowId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AzureInventoryTagReadModel>>([]);

    public Task<IReadOnlyList<AzureInventoryResourceRelationshipReadModel>> ListRelationshipsTouchingAzureResourceIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        string azureResourceId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AzureInventoryResourceRelationshipReadModel>>([]);

    public Task<IReadOnlyList<AzureInventoryRoleAssignmentReadModel>> ListRoleAssignmentsForAzureResourceScopeAsync(
        ScopeContext scope,
        Guid snapshotId,
        string azureResourceId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AzureInventoryRoleAssignmentReadModel>>([]);

    public Task<AzureInventoryDefenderBandContextReadModel?> TryGetDefenderBandContextAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<AzureInventoryDefenderBandContextReadModel?>(null);

    public Task<IReadOnlyList<AzureInventoryResourceRecord>?> ListResourceVisibilityRowsBySnapshotIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default) =>
        ListResourcesBySnapshotIdAsync(scope, snapshotId, cancellationToken);

    public Task<IReadOnlyList<AzureInventoryResourceRecord>> ListResourcesByCloudResourceIdsAsync(
        ScopeContext scope,
        Guid snapshotId,
        IReadOnlyList<Guid> cloudResourceIds,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<AzureInventoryResourceRecord>>([]);

    public Task<IReadOnlyList<AzureInventoryTagReadModel>> ListTagsByResourceRowIdsAsync(
        ScopeContext scope,
        Guid snapshotId,
        IReadOnlyList<Guid> resourceRowIds,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<AzureInventoryTagReadModel>>([]);

    public Task<AzureInventorySnapshotDetailReadModel?> TryGetAdvisoryTerraformVisibleSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default) =>
        TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);

    public Task<(IReadOnlyList<AzureInventoryResourceRecord> Resources, IReadOnlyList<AzureInventoryResourcePropertyReadModel> Properties)>
        ListResourcesAndPropertiesByCloudResourceIdsAsync(
            ScopeContext scope,
            Guid snapshotId,
            IReadOnlyList<Guid> cloudResourceIds,
            CancellationToken cancellationToken = default) =>
        Task.FromResult<(IReadOnlyList<AzureInventoryResourceRecord>, IReadOnlyList<AzureInventoryResourcePropertyReadModel>)>(
            ([], []));
}
