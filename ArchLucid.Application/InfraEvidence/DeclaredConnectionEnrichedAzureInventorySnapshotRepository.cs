using ArchLucid.Application.InfraEvidence.OperatorInferredConnections;
using ArchLucid.Application.InfraEvidence.SecurityDeclaredConnections;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Decorates snapshot detail reads with active human-declared and operator-confirmed connections.
/// </summary>
public sealed class DeclaredConnectionEnrichedAzureInventorySnapshotRepository(
    IAzureInventorySnapshotRepository inner,
    ISecurityDeclaredConnectionRepository declaredConnectionRepository,
    IOperatorInferredConnectionRepository operatorInferredConnectionRepository) : IAzureInventorySnapshotRepository
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

        return await EnrichAsync(scope, snapshotId, snapshot, cancellationToken);
    }

    public async Task<AzureInventorySnapshotDetailReadModel?> TryGetCanonicalSnapshotDetailAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        AzureInventorySnapshotDetailReadModel? snapshot =
            await inner.TryGetCanonicalSnapshotDetailAsync(scope, snapshotId, cancellationToken);
        return await EnrichAsync(scope, snapshotId, snapshot, cancellationToken);
    }

    private async Task<AzureInventorySnapshotDetailReadModel?> EnrichAsync(
        ScopeContext scope,
        Guid snapshotId,
        AzureInventorySnapshotDetailReadModel? snapshot,
        CancellationToken cancellationToken)
    {
        if (snapshot is null)
        {
            return null;
        }

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        IReadOnlyList<SecurityDeclaredConnectionRecord> activeConnections =
            await declaredConnectionRepository.ListActiveByTenantAsync(scope.TenantId, utcNow, cancellationToken);

        AzureInventorySnapshotDetailReadModel declaredMerged =
            SecurityDeclaredConnectionSnapshotMerger.Merge(snapshot, activeConnections, utcNow);

        IReadOnlyList<OperatorInferredConnectionRecord> confirmedConnections =
            (await operatorInferredConnectionRepository.ListBySnapshotAsync(scope.TenantId, snapshotId, cancellationToken))
            .Where(record => record.Status == OperatorInferredConnectionStatus.Confirmed)
            .ToList();

        return OperatorInferredConnectionSnapshotMerger.Merge(declaredMerged, confirmedConnections);
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

    public Task<IReadOnlyList<AzureInventoryResourceRecord>?> ListResourcesBySnapshotIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default) =>
        inner.ListResourcesBySnapshotIdAsync(scope, snapshotId, cancellationToken);

    public Task<AzureInventorySnapshotDeleteResult> TryDeleteSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default) =>
        inner.TryDeleteSnapshotAsync(scope, snapshotId, cancellationToken);

    public Task<IReadOnlyList<AzureInventoryResourcePropertyReadModel>> ListResourcePropertiesByResourceRowIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        Guid resourceRowId,
        CancellationToken cancellationToken = default) =>
        inner.ListResourcePropertiesByResourceRowIdAsync(scope, snapshotId, resourceRowId, cancellationToken);

    public Task<IReadOnlyList<AzureInventoryTagReadModel>> ListResourceTagsByResourceRowIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        Guid resourceRowId,
        CancellationToken cancellationToken = default) =>
        inner.ListResourceTagsByResourceRowIdAsync(scope, snapshotId, resourceRowId, cancellationToken);

    public Task<IReadOnlyList<AzureInventoryResourceRelationshipReadModel>> ListRelationshipsTouchingAzureResourceIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        string azureResourceId,
        CancellationToken cancellationToken = default) =>
        inner.ListRelationshipsTouchingAzureResourceIdAsync(scope, snapshotId, azureResourceId, cancellationToken);

    public Task<IReadOnlyList<AzureInventoryRoleAssignmentReadModel>> ListRoleAssignmentsForAzureResourceScopeAsync(
        ScopeContext scope,
        Guid snapshotId,
        string azureResourceId,
        CancellationToken cancellationToken = default) =>
        inner.ListRoleAssignmentsForAzureResourceScopeAsync(scope, snapshotId, azureResourceId, cancellationToken);

    public Task<AzureInventoryDefenderBandContextReadModel?> TryGetDefenderBandContextAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default) =>
        inner.TryGetDefenderBandContextAsync(scope, snapshotId, cancellationToken);

    public Task<IReadOnlyList<AzureInventoryResourceRecord>?> ListResourceVisibilityRowsBySnapshotIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default) =>
        inner.ListResourceVisibilityRowsBySnapshotIdAsync(scope, snapshotId, cancellationToken);

    public Task<IReadOnlyList<AzureInventoryResourceRecord>> ListResourcesByCloudResourceIdsAsync(
        ScopeContext scope,
        Guid snapshotId,
        IReadOnlyList<Guid> cloudResourceIds,
        CancellationToken cancellationToken = default) =>
        inner.ListResourcesByCloudResourceIdsAsync(scope, snapshotId, cloudResourceIds, cancellationToken);

    public Task<IReadOnlyList<AzureInventoryTagReadModel>> ListTagsByResourceRowIdsAsync(
        ScopeContext scope,
        Guid snapshotId,
        IReadOnlyList<Guid> resourceRowIds,
        CancellationToken cancellationToken = default) =>
        inner.ListTagsByResourceRowIdsAsync(scope, snapshotId, resourceRowIds, cancellationToken);

    public Task<AzureInventorySnapshotDetailReadModel?> TryGetAdvisoryTerraformVisibleSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default) =>
        inner.TryGetAdvisoryTerraformVisibleSnapshotAsync(scope, snapshotId, cancellationToken);

    public Task<(IReadOnlyList<AzureInventoryResourceRecord> Resources, IReadOnlyList<AzureInventoryResourcePropertyReadModel> Properties)>
        ListResourcesAndPropertiesByCloudResourceIdsAsync(
            ScopeContext scope,
            Guid snapshotId,
            IReadOnlyList<Guid> cloudResourceIds,
            CancellationToken cancellationToken = default) =>
        inner.ListResourcesAndPropertiesByCloudResourceIdsAsync(scope, snapshotId, cloudResourceIds, cancellationToken);
}
