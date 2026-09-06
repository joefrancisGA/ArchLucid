using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>In-memory hosts: cloud resource identity directory is not persisted to SQL.</summary>
public sealed class NoOpCloudResourceIdentityDirectory : ICloudResourceIdentityDirectory
{
    public Task<CloudResourceIdentityRecord> UpsertOnSnapshotAsync(
        ScopeContext scope,
        CloudProvider provider,
        string externalResourceId,
        Guid snapshotId,
        string? resourceType,
        string? subscriptionOrAccountId,
        string? resourceGroupOrProject,
        string? region,
        string? displayName,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return Task.FromResult(new CloudResourceIdentityRecord
        {
            CloudResourceId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            Provider = provider,
            ExternalResourceIdNormalized = externalResourceId,
            ResourceType = resourceType,
            SubscriptionOrAccountId = subscriptionOrAccountId,
            ResourceGroupOrProject = resourceGroupOrProject,
            Region = region,
            DisplayName = displayName,
            FirstSeenSnapshotId = snapshotId,
            LastSeenSnapshotId = snapshotId,
            FirstSeenUtc = TimeProvider.System.UtcNowDateTime(),
            LastSeenUtc = TimeProvider.System.UtcNowDateTime(),
        });
    }

    public Task<CloudResourceIdentityRecord?> TryGetByExternalIdAsync(
        ScopeContext scope,
        CloudProvider provider,
        string externalResourceId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<CloudResourceIdentityRecord?>(null);

    public Task<CloudResourceIdentityRecord?> TryGetByCloudResourceIdAsync(
        ScopeContext scope,
        Guid cloudResourceId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<CloudResourceIdentityRecord?>(null);

    public Task UpdateResourceCloudResourceIdAsync(
        ScopeContext scope,
        Guid resourceRowId,
        Guid cloudResourceId,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<(IReadOnlyList<CloudResourceIdentityRecord> Items, int TotalCount)> ListForExplorerAsync(
        ScopeContext scope,
        string? namePrefix,
        string? resourceType,
        string? resourceGroup,
        CloudResourceExplorerWorkQueue workQueue,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
        => Task.FromResult<(IReadOnlyList<CloudResourceIdentityRecord> Items, int TotalCount)>(([], 0));
}
