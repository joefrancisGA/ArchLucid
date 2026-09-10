using System.Collections.Concurrent;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>In-memory cloud resource identity directory for tests and in-memory hosts.</summary>
public sealed class InMemoryCloudResourceIdentityDirectory : ICloudResourceIdentityDirectory
{
    private readonly ConcurrentDictionary<ExternalKey, CloudResourceIdentityRecord> _byExternalKey = new();
    private readonly ConcurrentDictionary<CloudResourceKey, CloudResourceIdentityRecord> _byCloudResourceId = new();

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

        if (string.IsNullOrWhiteSpace(externalResourceId))
            throw new ArgumentException("External resource id is required.", nameof(externalResourceId));

        string normalized = ArmResourceIdNormalizer.Normalize(externalResourceId);
        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        ExternalKey externalKey = new(scope.TenantId, provider, normalized);

        if (_byExternalKey.TryGetValue(externalKey, out CloudResourceIdentityRecord? existing))
        {
            CloudResourceIdentityRecord updated = CloneRecord(
                existing,
                snapshotId,
                utcNow,
                resourceType,
                subscriptionOrAccountId,
                resourceGroupOrProject,
                region,
                displayName);

            _byExternalKey[externalKey] = updated;
            _byCloudResourceId[new CloudResourceKey(scope.TenantId, updated.CloudResourceId)] = updated;

            return Task.FromResult(updated);
        }

        CloudResourceIdentityRecord inserted = new()
        {
            CloudResourceId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            Provider = provider,
            ExternalResourceIdNormalized = normalized,
            ResourceType = resourceType,
            SubscriptionOrAccountId = subscriptionOrAccountId,
            ResourceGroupOrProject = resourceGroupOrProject,
            Region = region,
            DisplayName = displayName,
            FirstSeenSnapshotId = snapshotId,
            LastSeenSnapshotId = snapshotId,
            FirstSeenUtc = utcNow,
            LastSeenUtc = utcNow,
        };

        _byExternalKey[externalKey] = inserted;
        _byCloudResourceId[new CloudResourceKey(scope.TenantId, inserted.CloudResourceId)] = inserted;

        return Task.FromResult(inserted);
    }

    public Task<CloudResourceIdentityRecord?> TryGetByExternalIdAsync(
        ScopeContext scope,
        CloudProvider provider,
        string externalResourceId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        string normalized = ArmResourceIdNormalizer.Normalize(externalResourceId);

        if (string.IsNullOrEmpty(normalized))
            return Task.FromResult<CloudResourceIdentityRecord?>(null);

        ExternalKey externalKey = new(scope.TenantId, provider, normalized);

        if (!_byExternalKey.TryGetValue(externalKey, out CloudResourceIdentityRecord? record))
            return Task.FromResult<CloudResourceIdentityRecord?>(null);

        return Task.FromResult<CloudResourceIdentityRecord?>(record);
    }

    public Task<CloudResourceIdentityRecord?> TryGetByCloudResourceIdAsync(
        ScopeContext scope,
        Guid cloudResourceId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (cloudResourceId == Guid.Empty)
            return Task.FromResult<CloudResourceIdentityRecord?>(null);

        CloudResourceKey key = new(scope.TenantId, cloudResourceId);

        if (!_byCloudResourceId.TryGetValue(key, out CloudResourceIdentityRecord? record))
            return Task.FromResult<CloudResourceIdentityRecord?>(null);

        return Task.FromResult<CloudResourceIdentityRecord?>(record);
    }

    public Task UpdateResourceCloudResourceIdAsync(
        ScopeContext scope,
        Guid resourceRowId,
        Guid cloudResourceId,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<(IReadOnlyList<CloudResourceExplorerListItem> Items, int TotalCount)> ListForExplorerAsync(
        ScopeContext scope,
        string? namePrefix,
        string? resourceType,
        string? resourceGroup,
        CloudResourceExplorerWorkQueue workQueue,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        (int safePage, int safePageSize) = PaginationDefaults.Normalize(page, pageSize);
        int skip = PaginationDefaults.ToSkip(safePage, safePageSize);
        string? trimmedPrefix = string.IsNullOrWhiteSpace(namePrefix) ? null : namePrefix.Trim();
        string? trimmedType = string.IsNullOrWhiteSpace(resourceType) ? null : resourceType.Trim();
        string? trimmedGroup = string.IsNullOrWhiteSpace(resourceGroup) ? null : resourceGroup.Trim();

        IEnumerable<CloudResourceIdentityRecord> query = _byCloudResourceId.Values.Where(record =>
            record.TenantId == scope.TenantId
            && record.WorkspaceId == scope.WorkspaceId
            && record.ProjectId == scope.ProjectId);

        if (trimmedPrefix is not null)
        {
            query = query.Where(record =>
                (record.DisplayName?.StartsWith(trimmedPrefix, StringComparison.OrdinalIgnoreCase) ?? false)
                || record.ExternalResourceIdNormalized.Contains(trimmedPrefix, StringComparison.OrdinalIgnoreCase));
        }

        if (trimmedType is not null)
            query = query.Where(record => string.Equals(record.ResourceType, trimmedType, StringComparison.Ordinal));

        if (trimmedGroup is not null)
        {
            query = query.Where(record =>
                string.Equals(record.ResourceGroupOrProject, trimmedGroup, StringComparison.Ordinal));
        }

        List<CloudResourceIdentityRecord> ordered = query
            .OrderByDescending(record => record.LastSeenUtc)
            .ToList();

        int totalCount = ordered.Count;
        IReadOnlyList<CloudResourceExplorerListItem> items = ordered
            .Skip(skip)
            .Take(safePageSize)
            .Select(record => new CloudResourceExplorerListItem
            {
                Identity = record,
                WorkCounts = new CloudResourceExplorerWorkCounts(),
            })
            .ToList();

        return Task.FromResult<(IReadOnlyList<CloudResourceExplorerListItem> Items, int TotalCount)>((items, totalCount));
    }

    private static CloudResourceIdentityRecord CloneRecord(
        CloudResourceIdentityRecord existing,
        Guid snapshotId,
        DateTime utcNow,
        string? resourceType,
        string? subscriptionOrAccountId,
        string? resourceGroupOrProject,
        string? region,
        string? displayName)
        => new()
        {
            CloudResourceId = existing.CloudResourceId,
            TenantId = existing.TenantId,
            WorkspaceId = existing.WorkspaceId,
            ProjectId = existing.ProjectId,
            Provider = existing.Provider,
            ExternalResourceIdNormalized = existing.ExternalResourceIdNormalized,
            ResourceType = resourceType ?? existing.ResourceType,
            SubscriptionOrAccountId = subscriptionOrAccountId ?? existing.SubscriptionOrAccountId,
            ResourceGroupOrProject = resourceGroupOrProject ?? existing.ResourceGroupOrProject,
            Region = region ?? existing.Region,
            DisplayName = displayName ?? existing.DisplayName,
            FirstSeenSnapshotId = existing.FirstSeenSnapshotId ?? snapshotId,
            LastSeenSnapshotId = snapshotId,
            FirstSeenUtc = existing.FirstSeenUtc,
            LastSeenUtc = utcNow,
        };

    private readonly record struct ExternalKey(Guid TenantId, CloudProvider Provider, string ExternalResourceIdNormalized);

    private readonly record struct CloudResourceKey(Guid TenantId, Guid CloudResourceId);
}
