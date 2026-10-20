using ArchLucid.Core.Tenancy;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>Null-safe tenant workspace inventory reads (parity across workspace controllers and scope preflight).</summary>
internal static class TenantWorkspaceInventoryCoalesce
{
    internal static IReadOnlyList<TenantWorkspaceListItem> CoalesceWorkspaces(
        IReadOnlyList<TenantWorkspaceListItem>? workspaces) =>
        workspaces ?? Array.Empty<TenantWorkspaceListItem>();
}
