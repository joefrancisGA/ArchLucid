namespace ArchLucid.Application.Common;

/// <summary>
///     Host-bound read of the caller's Entra app roles for application-layer authorization that cannot rely on MVC
///     <see cref="Microsoft.AspNetCore.Mvc.ControllerBase.User" />.
/// </summary>
public interface ICallerRoleAccessor
{
    bool IsInRole(string role);

    /// <summary>Tenant or workspace administrator personas (<c>Admin</c>, <c>WorkspaceAdmin</c>).</summary>
    bool IsTenantAdministrator();
}
