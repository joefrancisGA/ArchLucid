using System.Security.Claims;

using ArchLucid.Application.Authorization;
using ArchLucid.Application.Common;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authentication;

namespace ArchLucid.Api.Auth.Services;

/// <summary>
///     Adds <see cref="Permissions.ClaimType" /> claims from assigned custom roles for the SCIM-linked directory user.
/// </summary>
public sealed class CustomRoleClaimsTransformation(
    IScopeContextProvider scopeProvider,
    IScimUserRepository scimUsers,
    ICustomRolePermissionEvaluator permissionEvaluator) : IClaimsTransformation
{
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IScimUserRepository _scimUsers =
        scimUsers ?? throw new ArgumentNullException(nameof(scimUsers));

    private readonly ICustomRolePermissionEvaluator _permissionEvaluator =
        permissionEvaluator ?? throw new ArgumentNullException(nameof(permissionEvaluator));

    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (principal.Identity?.IsAuthenticated != true)
            return principal;

        ScopeContext scope;

        try
        {
            scope = _scopeProvider.GetCurrentScope();
        }
        catch (InvalidOperationException)
        {
            return principal;
        }

        Guid? scimUserId = await TryResolveScimUserIdAsync(principal, scope.TenantId, CancellationToken.None);

        if (scimUserId is null)
            return principal;

        IReadOnlyList<string> permissions =
            await _permissionEvaluator.GetEffectivePermissionsAsync(scope.TenantId, scimUserId.Value, CancellationToken.None);

        if (permissions.Count == 0)
            return principal;

        ClaimsPrincipal clone = principal.Clone();

        if (clone.Identity is not ClaimsIdentity id)
            return principal;

        foreach (string permission in permissions)
        {
            if (!id.HasClaim(Permissions.ClaimType, permission))
                id.AddClaim(new Claim(Permissions.ClaimType, permission));
        }

        return clone;
    }

    private async Task<Guid?> TryResolveScimUserIdAsync(
        ClaimsPrincipal principal,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        string? externalId = principal.FindFirst("sub")?.Value
            ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(externalId))
            return null;

        ScimUserRecord? user = await _scimUsers.GetByExternalIdAsync(tenantId, externalId, cancellationToken);

        return user?.Id;
    }
}
