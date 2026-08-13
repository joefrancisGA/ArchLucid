using System.Collections.Concurrent;
using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using JetBrains.Annotations;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class InMemoryTenantRepository
{

    public Task InsertWorkspaceAsync(
        Guid workspaceId,
        Guid tenantId,
        string name,
        Guid defaultProjectId,
        CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        _ = ct;

        List<TenantWorkspaceRow> list = _workspacesByTenant.GetOrAdd(tenantId, static _ => []);

        lock (list)

            list.Add(
                new TenantWorkspaceRow
                {
                    Id = workspaceId,
                    TenantId = tenantId,
                    Name = name,
                    DefaultProjectId = defaultProjectId,
                    CreatedUtc = TimeProvider.System.GetUtcNow()
                });

        return Task.CompletedTask;
    }


    public Task<TenantWorkspaceLink?> GetFirstWorkspaceAsync(Guid tenantId, CancellationToken ct)
    {
        _ = ct;

        if (!_workspacesByTenant.TryGetValue(tenantId, out List<TenantWorkspaceRow>? list))
            return Task.FromResult<TenantWorkspaceLink?>(null);

        TenantWorkspaceRow? row;

        lock (list)

            row = list.OrderBy(static w => w.CreatedUtc).FirstOrDefault();

        if (row is null)
            return Task.FromResult<TenantWorkspaceLink?>(null);

        return Task.FromResult<TenantWorkspaceLink?>(
            new TenantWorkspaceLink { WorkspaceId = row.Id, DefaultProjectId = row.DefaultProjectId });
    }


    /// <inheritdoc />
    public Task<IReadOnlyList<TenantWorkspaceListItem>> ListWorkspacesAsync(Guid tenantId, CancellationToken ct)
    {
        _ = ct;

        if (!_workspacesByTenant.TryGetValue(tenantId, out List<TenantWorkspaceRow>? list))
            return Task.FromResult<IReadOnlyList<TenantWorkspaceListItem>>([]);

        List<TenantWorkspaceListItem> copy;

        lock (list)
        {
            copy = list.OrderBy(static w => w.CreatedUtc)
                .Select(static w => new TenantWorkspaceListItem
                {
                    WorkspaceId = w.Id,
                    TenantId = w.TenantId,
                    Name = w.Name,
                    DefaultProjectId = w.DefaultProjectId,
                    CreatedUtc = w.CreatedUtc
                })
                .ToList();
        }

        return Task.FromResult<IReadOnlyList<TenantWorkspaceListItem>>(copy);
    }
}
