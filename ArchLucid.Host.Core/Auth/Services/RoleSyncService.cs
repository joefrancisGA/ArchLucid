using System.Security.Claims;

using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;

namespace ArchLucid.Host.Core.Auth.Services;

/// <inheritdoc cref="IRoleSyncService" />
public sealed class RoleSyncService(IScimUserRepository scimUsers) : IRoleSyncService
{
    private const string RolesShortClaim = "roles";

    private const string MappedRoleClaimType = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

    private readonly IScimUserRepository _scimUsers = scimUsers ?? throw new ArgumentNullException(nameof(scimUsers));

    /// <inheritdoc />
    public async Task ApplyEntraJwtAndDirectoryOverridesAsync(ClaimsPrincipal bearerPrincipal, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(bearerPrincipal);

        ClaimsIdentity? identity = bearerPrincipal.Identity as ClaimsIdentity;

        if (identity?.IsAuthenticated != true)
            return;

        string? tenantRaw = bearerPrincipal.FindFirst("tenant_id")?.Value;

        if (!Guid.TryParse(tenantRaw, out Guid tenantId))
            return;

        string? directoryKey = TryDirectoryObjectKey(bearerPrincipal);

        if (string.IsNullOrWhiteSpace(directoryKey))
            return;

        ScimUserRecord? row = await _scimUsers.GetByExternalIdAsync(tenantId, directoryKey.Trim(), cancellationToken).ConfigureAwait(false);

        if (row is null || row.DirectoryRemovedUtc is not null)
            return;

        if (row.ResolvedRoleOrigin != ScimResolvedRoleOrigin.Manual || string.IsNullOrWhiteSpace(row.ResolvedRole))
            return;

        StripInboundRoleClaims(identity);

        foreach (Claim c in RoleClaimsForPolicies(row.ResolvedRole.Trim()))
            identity.AddClaim(c);
    }

    /// <summary>
    ///     Entra access tokens usually carry <c>oid</c>; some stacks emit the long objectidentifier claim URI only.
    /// </summary>
    public static string? TryDirectoryObjectKey(ClaimsPrincipal principal)
    {
        string? oid = principal.FindFirst("oid")?.Value;

        if (!string.IsNullOrWhiteSpace(oid))
            return oid.Trim();

        return principal.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value?.Trim();
    }

    private static IEnumerable<Claim> RoleClaimsForPolicies(string canonicalRoleValue)
    {
        yield return new Claim(ClaimTypes.Role, canonicalRoleValue);
        yield return new Claim(RolesShortClaim, canonicalRoleValue);
    }

    private static void StripInboundRoleClaims(ClaimsIdentity identity)
    {
        foreach (Claim c in identity.Claims.Where(IsInboundRoleClaim).ToList())
            identity.TryRemoveClaim(c);
    }

    private static bool IsInboundRoleClaim(Claim c)
    {
        if (string.Equals(c.Type, ClaimTypes.Role, StringComparison.OrdinalIgnoreCase))
            return true;

        if (string.Equals(c.Type, RolesShortClaim, StringComparison.OrdinalIgnoreCase))
            return true;

        if (string.Equals(c.Type, MappedRoleClaimType, StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }
}
