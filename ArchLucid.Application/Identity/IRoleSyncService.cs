using System.Security.Claims;

using ArchLucid.Core.Scim.Models;

namespace ArchLucid.Application.Identity;

/// <summary>
///     Aligns bearer <see cref="ClaimsPrincipal" /> roles with tenant directory state: prefers Entra / OIDC JWT app roles
///     (<c>roles</c> / <see cref="ClaimTypes.Role" />) unless a SCIM user row marked <see cref="ScimResolvedRoleOrigin.Manual" />
///     overrides assignments (operator-controlled).
/// </summary>
public interface IRoleSyncService
{
    /// <summary>
    ///     When a matching SCIM principal has a manual resolved role, strips inbound role claims and re-adds the manual
    ///     role as both <see cref="ClaimTypes.Role" /> and <c>roles</c> so ArchLucid authorization policies and legacy
    ///     permission expansion stay coherent. Otherwise leaves claims unchanged (JWT / IdP drives RBAC).
    /// </summary>
    Task ApplyEntraJwtAndDirectoryOverridesAsync(ClaimsPrincipal bearerPrincipal, CancellationToken cancellationToken);
}
