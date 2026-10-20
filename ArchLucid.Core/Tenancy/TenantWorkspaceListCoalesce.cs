namespace ArchLucid.Core.Tenancy;

/// <summary>Null-safe reads of tenant workspace inventory lists from repositories and test doubles.</summary>
public static class TenantWorkspaceListCoalesce
{
    public static IReadOnlyList<TenantWorkspaceListItem> Coalesce(
        IReadOnlyList<TenantWorkspaceListItem>? workspaces) =>
        workspaces ?? Array.Empty<TenantWorkspaceListItem>();
}
