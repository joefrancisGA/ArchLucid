using System.Security.Claims;

using ArchLucid.Core.Scim.Models;

namespace ArchLucid.Host.Core.Auth.Services;

/// <summary>
///     Aligns bearer <see cref="ClaimsPrincipal" /> roles with tenant directory state: JWT / Entra app roles are
///     authoritative unless SCIM marks a manual <see cref="ScimResolvedRoleOrigin.Manual" /> override on the user's row.
/// </summary>
public interface IRoleSyncService
{
    /// <summary>
    ///     When a matching SCIM principal has <see cref="ScimResolvedRoleOrigin.Manual" />, replaces inbound JWT role claims
    ///     with that stored role string (dual <see cref="ClaimTypes.Role" /> + <c>roles</c> emission for ASP.NET RBAC parity).
    /// </summary>
    Task ApplyEntraJwtAndDirectoryOverridesAsync(ClaimsPrincipal bearerPrincipal, CancellationToken cancellationToken);
}
