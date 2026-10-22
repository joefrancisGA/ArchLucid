using ArchLucid.Core.Tenancy;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>API-layer alias for <see cref="TenantWorkspaceListCoalesce" /> (workspace controllers and scope preflight).</summary>
internal static class TenantWorkspaceInventoryCoalesce
{
    internal static IReadOnlyList<TenantWorkspaceListItem> CoalesceWorkspaces(
        IReadOnlyList<TenantWorkspaceListItem>? workspaces) =>
        TenantWorkspaceListCoalesce.Coalesce(workspaces);
}
