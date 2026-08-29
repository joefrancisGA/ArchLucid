namespace ArchLucid.Core.Tenancy;

/// <summary>Persistence for <c>dbo.TenantWorkspaces</c>.</summary>
public interface ITenantWorkspaceRepository
{
    Task InsertWorkspaceAsync(
        Guid workspaceId,
        Guid tenantId,
        string name,
        Guid defaultProjectId,
        CancellationToken ct);

    /// <summary>All workspaces for the tenant ordered by <c>CreatedUtc</c> (ascending).</summary>
    Task<IReadOnlyList<TenantWorkspaceListItem>> ListWorkspacesAsync(Guid tenantId, CancellationToken ct);

    /// <summary>True when <paramref name="workspaceId" /> belongs to <paramref name="tenantId" />.</summary>
    Task<bool> WorkspaceExistsAsync(Guid tenantId, Guid workspaceId, CancellationToken ct);

    /// <summary>Oldest workspace for the tenant (default bootstrap workspace).</summary>
    Task<TenantWorkspaceLink?> GetFirstWorkspaceAsync(Guid tenantId, CancellationToken ct);
}
