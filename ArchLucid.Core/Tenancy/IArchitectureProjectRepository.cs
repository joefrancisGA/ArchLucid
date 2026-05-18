namespace ArchLucid.Core.Tenancy;

/// <summary>Persistence for <c>dbo.Projects</c> (scoped architecture projects with soft-delete).</summary>
public interface IArchitectureProjectRepository
{
    /// <summary>Inserts a project row (caller supplies id, typically aligned with <c>TenantWorkspaces.DefaultProjectId</c>).</summary>
    Task InsertAsync(Guid id, Guid tenantId, Guid workspaceId, string name, CancellationToken ct);

    /// <summary>Active projects for the tenant (excludes <c>IsDeleted = 1</c>).</summary>
    Task<IReadOnlyList<ArchitectureProjectRecord>> ListActiveByTenantAsync(Guid tenantId, CancellationToken ct);

    /// <summary>Soft-deleted projects for the tenant (<c>IsDeleted = 1</c>), including <see cref="ArchitectureProjectRecord.DeletedUtc" />.</summary>
    Task<IReadOnlyList<ArchitectureProjectRecord>> ListSoftDeletedByTenantAsync(Guid tenantId, CancellationToken ct);

    /// <summary>Soft-delete (<c>IsDeleted</c> 0→1) for a project in the workspace scope.</summary>
    /// <returns><c>true</c> when exactly one row was updated.</returns>
    Task<bool> TrySoftDeleteAsync(Guid tenantId, Guid workspaceId, Guid projectId, CancellationToken ct);

    /// <summary>Restores a soft-deleted project when workspace name uniqueness permits.</summary>
    Task<ArchitectureProjectRestoreResult> TryRestoreAsync(Guid tenantId, Guid workspaceId, Guid projectId, CancellationToken ct);
}
