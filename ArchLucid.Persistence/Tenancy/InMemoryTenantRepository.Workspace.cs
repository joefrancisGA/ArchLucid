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
        ct.ThrowIfCancellationRequested();

        // Match SQL's FK_TenantWorkspaces_Tenants and globally unique primary key.
        // A single lock protects tenant existence and workspace-ID uniqueness across
        // every tenant; locking only the tenant's list permits cross-tenant collisions.
        lock (_trialGate)
        {
            ct.ThrowIfCancellationRequested();
            if (!_byId.ContainsKey(tenantId))
                throw new InvalidOperationException($"Tenant '{tenantId:D}' does not exist.");

            foreach (List<TenantWorkspaceRow> existing in _workspacesByTenant.Values)
            {
                lock (existing)
                {
                    if (existing.Any(w => w.Id == workspaceId))
                        throw new InvalidOperationException(
                            $"Workspace '{workspaceId:D}' already exists.");
                }
            }

            List<TenantWorkspaceRow> list =
                _workspacesByTenant.GetOrAdd(tenantId, static _ => []);

            lock (list)
            {
                list.Add(new TenantWorkspaceRow
                {
                    Id = workspaceId,
                    TenantId = tenantId,
                    Name = name,
                    DefaultProjectId = defaultProjectId,
                    CreatedUtc = TimeProvider.System.GetUtcNow(),
                });
            }
        }

        return Task.CompletedTask;
    }


    public Task<TenantWorkspaceLink?> GetFirstWorkspaceAsync(Guid tenantId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (!_workspacesByTenant.TryGetValue(tenantId, out List<TenantWorkspaceRow>? list))
            return Task.FromResult<TenantWorkspaceLink?>(null);

        TenantWorkspaceRow? row;

        lock (list)

            row = TenantWorkspaceOrdering.OrderByCreatedUtcThenSqlId(
                list, static w => w.CreatedUtc, static w => w.Id).FirstOrDefault();

        if (row is null)
            return Task.FromResult<TenantWorkspaceLink?>(null);

        return Task.FromResult<TenantWorkspaceLink?>(
            new TenantWorkspaceLink { WorkspaceId = row.Id, DefaultProjectId = row.DefaultProjectId });
    }


    /// <inheritdoc />
    public Task<bool> WorkspaceExistsAsync(Guid tenantId, Guid workspaceId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (!_workspacesByTenant.TryGetValue(tenantId, out List<TenantWorkspaceRow>? list))
            return Task.FromResult(false);

        bool exists;

        lock (list)
            exists = list.Any(w => w.Id == workspaceId);

        return Task.FromResult(exists);
    }

    /// <inheritdoc />
    public Task<TenantWorkspaceListItem?> GetWorkspaceByIdAsync(Guid tenantId, Guid workspaceId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (!_workspacesByTenant.TryGetValue(tenantId, out List<TenantWorkspaceRow>? list))
            return Task.FromResult<TenantWorkspaceListItem?>(null);

        TenantWorkspaceRow? row;

        lock (list)
            row = list.FirstOrDefault(w => w.Id == workspaceId);

        if (row is null)
            return Task.FromResult<TenantWorkspaceListItem?>(null);

        return Task.FromResult<TenantWorkspaceListItem?>(new TenantWorkspaceListItem
        {
            WorkspaceId = row.Id,
            TenantId = row.TenantId,
            Name = row.Name,
            DefaultProjectId = row.DefaultProjectId,
            CreatedUtc = row.CreatedUtc
        });
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<TenantWorkspaceListItem>> ListWorkspacesAsync(Guid tenantId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (!_workspacesByTenant.TryGetValue(tenantId, out List<TenantWorkspaceRow>? list))
            return Task.FromResult<IReadOnlyList<TenantWorkspaceListItem>>([]);

        List<TenantWorkspaceListItem> copy;

        lock (list)
        {
            copy = TenantWorkspaceOrdering.OrderByCreatedUtcThenSqlId(
                    list, static w => w.CreatedUtc, static w => w.Id)
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
