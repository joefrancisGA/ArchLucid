using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ICloudResourceIdentityDirectory
{
    async Task<IReadOnlyDictionary<string, CloudResourceIdentityRecord>> UpsertSnapshotBatchAsync(
        ScopeContext scope,
        CloudProvider provider,
        Guid snapshotId,
        IReadOnlyList<CloudResourceIdentitySnapshotWrite> resources,
        CancellationToken cancellationToken = default)
    {
        Dictionary<string, CloudResourceIdentityRecord> result = new(StringComparer.OrdinalIgnoreCase);
        foreach (CloudResourceIdentitySnapshotWrite resource in resources)
        {
            CloudResourceIdentityRecord identity = await UpsertOnSnapshotAsync(
                scope, provider, resource.ExternalResourceId, snapshotId, resource.ResourceType,
                resource.SubscriptionOrAccountId, resource.ResourceGroupOrProject, resource.Region,
                resource.DisplayName, cancellationToken);
            result[identity.ExternalResourceIdNormalized] = identity;
        }
        return result;
    }

    Task<CloudResourceIdentityRecord> UpsertOnSnapshotAsync(
        ScopeContext scope,
        CloudProvider provider,
        string externalResourceId,
        Guid snapshotId,
        string? resourceType,
        string? subscriptionOrAccountId,
        string? resourceGroupOrProject,
        string? region,
        string? displayName,
        CancellationToken cancellationToken = default);

    Task<CloudResourceIdentityRecord?> TryGetByExternalIdAsync(
        ScopeContext scope,
        CloudProvider provider,
        string externalResourceId,
        CancellationToken cancellationToken = default);

    Task<CloudResourceIdentityRecord?> TryGetByCloudResourceIdAsync(
        ScopeContext scope,
        Guid cloudResourceId,
        CancellationToken cancellationToken = default);

    Task UpdateResourceCloudResourceIdAsync(
        ScopeContext scope,
        Guid resourceRowId,
        Guid cloudResourceId,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<CloudResourceExplorerListItem> Items, int TotalCount)> ListForExplorerAsync(
        ScopeContext scope,
        string? namePrefix,
        string? resourceType,
        string? resourceGroup,
        CloudResourceExplorerWorkQueue workQueue,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
}
