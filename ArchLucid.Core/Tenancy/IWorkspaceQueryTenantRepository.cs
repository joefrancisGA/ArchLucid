namespace ArchLucid.Core.Tenancy;

/// <summary>
///     Optional capability interface that a <see cref="ITenantRepository" /> implementation may also implement to expose
///     efficient, O(1) workspace existence and lookup operations.  Consumers use pattern matching
///     (<c>if (repo is IWorkspaceQueryTenantRepository q)</c>) so callers that resolve only
///     <see cref="ITenantRepository" /> from DI are unaffected.
/// </summary>
public interface IWorkspaceQueryTenantRepository
{
    /// <summary>Returns <see langword="true" /> when a workspace with <paramref name="workspaceId" /> exists for the given tenant.</summary>
    Task<bool> WorkspaceExistsAsync(Guid tenantId, Guid workspaceId, CancellationToken ct);

    /// <summary>Returns the workspace record, or <see langword="null" /> when it does not exist.</summary>
    Task<TenantWorkspaceListItem?> GetWorkspaceByIdAsync(Guid tenantId, Guid workspaceId, CancellationToken ct);
}
