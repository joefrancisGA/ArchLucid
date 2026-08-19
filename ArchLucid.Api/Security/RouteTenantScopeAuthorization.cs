using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Security;

/// <summary>
///     Guards admin and authority routes that accept a <c>{tenantId}</c> path segment against cross-tenant IDOR
///     (TB-274 / BE-014–016).
/// </summary>
internal static class RouteTenantScopeAuthorization
{
    /// <summary>
    ///     Returns <see cref="StatusCodes.Status403Forbidden" /> when the route tenant does not match ambient scope.
    /// </summary>
    internal static IActionResult? ForbidWhenRouteTenantDiffersFromScope(Guid routeTenantId, ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (routeTenantId != scope.TenantId)
            return new StatusCodeResult(StatusCodes.Status403Forbidden);

        return null;
    }
}
