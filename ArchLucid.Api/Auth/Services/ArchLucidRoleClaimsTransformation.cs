using System.Security.Claims;
using System.Text.Json;

using ArchLucid.Host.Core.Auth.Services;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;

namespace ArchLucid.Api.Auth.Services;

/// <summary>
///     Maps ArchLucid roles to legacy <c>permission</c> claims so existing policies
///     (CanCommitRuns, CanReplayComparisons, etc.) keep working with JWT or dev bypass.
/// </summary>
/// <remarks>
///     JWT / Entra app role claims (<c>roles</c>) are authoritative unless <see cref="IRoleSyncService" /> applies a
///     SCIM manual override for the inbound principal.
/// </remarks>
public sealed class ArchLucidRoleClaimsTransformation(
    IRoleSyncService roleSync,
    IHttpContextAccessor httpContextAccessor) : IClaimsTransformation
{
    private readonly IRoleSyncService _roleSync = roleSync ?? throw new ArgumentNullException(nameof(roleSync));

    private readonly IHttpContextAccessor _httpContextAccessor =
        httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));

    private static readonly string[] AdminPermissions =
    [
        "commit:run",
        "seed:results",
        "export:consulting-docx",
        "replay:comparisons",
        "replay:diagnostics",
        "metrics:read"
    ];

    private static readonly string[] OperatorPermissions =
    [
        "commit:run",
        "seed:results",
        "export:consulting-docx",
        "replay:comparisons",
        "replay:diagnostics"
    ];

    private static readonly string[] ReviewerPermissions =
    [
        "seed:results",
        "export:consulting-docx",
        "replay:comparisons",
        "replay:diagnostics"
    ];

    private const string MicrosoftWsIdentityRoleClaimUri =
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

    /// <inheritdoc />
    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (principal.Identity?.IsAuthenticated != true)
            return principal;

        ClaimsPrincipal clone = principal.Clone();

        if (clone.Identity is not ClaimsIdentity id)
            return principal;

        CancellationToken ct = CancellationToken.None;
        HttpContext? httpContext = _httpContextAccessor.HttpContext;

        if (httpContext is not null)
            ct = httpContext.RequestAborted;

        await _roleSync.ApplyEntraJwtAndDirectoryOverridesAsync(clone, ct).ConfigureAwait(false);

        HashSet<string> roles = BuildRoleSet(clone);

        if (roles.Contains(ArchLucidRoles.Admin))
            foreach (string p in AdminPermissions)
                AddPermission(p);

        else if (roles.Contains(ArchLucidRoles.WorkspaceAdmin))
            foreach (string p in AdminPermissions)
                AddPermission(p);

        else if (roles.Contains(ArchLucidRoles.Architect))
            foreach (string p in OperatorPermissions)
                AddPermission(p);

        else if (roles.Contains(ArchLucidRoles.Operator))
            foreach (string p in OperatorPermissions)
                AddPermission(p);

        else if (roles.Contains(ArchLucidRoles.Reviewer))
            foreach (string p in ReviewerPermissions)
                AddPermission(p);

        else if (roles.Contains(ArchLucidRoles.Reader))
            AddPermission("metrics:read");

        else if (roles.Contains(ArchLucidRoles.Auditor))
            AddPermission("metrics:read");

        return clone;

        void AddPermission(string value)
        {
            if (!id.HasClaim("permission", value))
                id.AddClaim(new Claim("permission", value));
        }
    }

    private static HashSet<string> BuildRoleSet(ClaimsPrincipal principal)
    {
        HashSet<string> roles = new(StringComparer.OrdinalIgnoreCase);

        foreach (Claim c in principal.FindAll(ClaimTypes.Role))
            ExpandRolesClaimJsonArray(c.Value, roles);

        foreach (Claim c in principal.FindAll("roles"))
            ExpandRolesClaimJsonArray(c.Value, roles);

        foreach (Claim c in principal.FindAll(MicrosoftWsIdentityRoleClaimUri))
            ExpandRolesClaimJsonArray(c.Value, roles);

        return roles;
    }

    /// <remarks>
    ///     Entra emits <c>roles</c> either as duplicate string claims or, on some intermediaries, a single JSON-encoded
    ///     array token — accept both without failing policy resolution.
    /// </remarks>
    private static void ExpandRolesClaimJsonArray(string? raw, HashSet<string> sink)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return;

        string trimmed = raw.TrimStart();

        if (trimmed.StartsWith("[", StringComparison.Ordinal))
        {
            try
            {
                string[]? arr = JsonSerializer.Deserialize<string[]>(raw);

                if (arr is not null)
                {
                    foreach (string s in arr)
                    {
                        if (!string.IsNullOrWhiteSpace(s))
                            sink.Add(s);
                    }

                    return;
                }
            }
            catch (JsonException)
            {
                sink.Add(raw);

                return;
            }
        }

        sink.Add(raw);
    }
}
