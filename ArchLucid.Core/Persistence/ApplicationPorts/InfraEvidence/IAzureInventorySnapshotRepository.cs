using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IAzureInventorySnapshotRepository
{
    Task InsertHeaderAsync(AzureInventorySnapshotRecord record, CancellationToken cancellationToken = default);

    Task<AzureInventorySnapshotRecord?> TryGetByPackageIdAsync(
        ScopeContext scope,
        Guid packageId,
        CancellationToken cancellationToken = default);

    Task<AzureInventorySnapshotRecord?> TryGetBySnapshotIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    /// <summary>Reads all stored evidence without diagram visibility filtering, within the caller's scope.</summary>
    Task<AzureInventorySnapshotDetailReadModel?> TryGetCanonicalSnapshotDetailAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    Task<AzureInventorySnapshotDetailReadModel?> TryGetSnapshotDetailAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    Task MaterializeSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        AzureInventorySnapshotMaterializeWriteRequest writeRequest,
        CancellationToken cancellationToken = default);

    Task<Guid?> TryGetPriorMaterializedSnapshotIdAsync(
        ScopeContext scope,
        string subscriptionId,
        Guid newerSnapshotId,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<AzureInventorySnapshotRecord> Items, int TotalCount)> ListSnapshotsAsync(
        ScopeContext scope,
        int page,
        int pageSize,
        string? subscriptionId,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<AzureInventoryResourceRecord> Items, int TotalCount)?> ListResourcesBySnapshotIdPagedAsync(
        ScopeContext scope,
        Guid snapshotId,
        int page,
        int pageSize,
        Guid? cloudResourceId = null,
        CancellationToken cancellationToken = default);

    async Task<IReadOnlyList<AzureInventoryResourceRecord>?> ListResourcesBySnapshotIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        AzureInventorySnapshotRecord? header =
            await TryGetBySnapshotIdAsync(scope, snapshotId, cancellationToken);

        if (header is null)
        {
            return null;
        }

        AzureInventorySnapshotDetailReadModel? detail =
            await TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);

        return detail?.Resources.ToList();
    }

    Task<AzureInventorySnapshotDeleteResult> TryDeleteSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AzureInventoryResourcePropertyReadModel>> ListResourcePropertiesByResourceRowIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        Guid resourceRowId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<AzureInventoryResourcePropertyReadModel>>([]);

    Task<IReadOnlyList<AzureInventoryTagReadModel>> ListResourceTagsByResourceRowIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        Guid resourceRowId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<AzureInventoryTagReadModel>>([]);

    Task<IReadOnlyList<AzureInventoryResourceRelationshipReadModel>> ListRelationshipsTouchingAzureResourceIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        string azureResourceId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<AzureInventoryResourceRelationshipReadModel>>([]);

    Task<IReadOnlyList<AzureInventoryRoleAssignmentReadModel>> ListRoleAssignmentsForAzureResourceScopeAsync(
        ScopeContext scope,
        Guid snapshotId,
        string azureResourceId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<AzureInventoryRoleAssignmentReadModel>>([]);

    Task<AzureInventoryDefenderBandContextReadModel?> TryGetDefenderBandContextAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<AzureInventoryDefenderBandContextReadModel?>(null);

    Task<IReadOnlyList<AzureInventoryResourceRecord>?> ListResourceVisibilityRowsBySnapshotIdAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default) =>
        ListResourcesBySnapshotIdAsync(scope, snapshotId, cancellationToken);

    Task<IReadOnlyList<AzureInventoryResourceRecord>> ListResourcesByCloudResourceIdsAsync(
        ScopeContext scope,
        Guid snapshotId,
        IReadOnlyList<Guid> cloudResourceIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(cloudResourceIds);

        if (cloudResourceIds.Count == 0)
            return Task.FromResult<IReadOnlyList<AzureInventoryResourceRecord>>([]);

        return Task.FromResult<IReadOnlyList<AzureInventoryResourceRecord>>([]);
    }

    Task<IReadOnlyList<AzureInventoryTagReadModel>> ListTagsByResourceRowIdsAsync(
        ScopeContext scope,
        Guid snapshotId,
        IReadOnlyList<Guid> resourceRowIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(resourceRowIds);

        if (resourceRowIds.Count == 0)
            return Task.FromResult<IReadOnlyList<AzureInventoryTagReadModel>>([]);

        return Task.FromResult<IReadOnlyList<AzureInventoryTagReadModel>>([]);
    }

    /// <summary>Reads only stored inventory rows needed by the public IP assessment, without operator enrichment.</summary>
    Task<AzureInventorySnapshotDetailReadModel?> TryGetPublicIpAssessmentInventoryAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<AzureInventorySnapshotDetailReadModel?>(null);

    Task<AzureInventorySnapshotDetailReadModel?> TryGetAdvisoryTerraformVisibleSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default) =>
        TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);

    Task<(IReadOnlyList<AzureInventoryResourceRecord> Resources, IReadOnlyList<AzureInventoryResourcePropertyReadModel> Properties)>
        ListResourcesAndPropertiesByCloudResourceIdsAsync(
            ScopeContext scope,
            Guid snapshotId,
            IReadOnlyList<Guid> cloudResourceIds,
            CancellationToken cancellationToken = default) =>
        Task.FromResult<(IReadOnlyList<AzureInventoryResourceRecord>, IReadOnlyList<AzureInventoryResourcePropertyReadModel>)>(
            ([], []));
}
