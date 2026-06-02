using System.Security.Claims;
using System.Text.Json;

using ArchLucid.Core.Authorization;

namespace ArchLucid.Api.Auth.Services;

/// <summary>Reads role claim values using the same claim types as <see cref="ArchLucidRoleClaimsTransformation" />.</summary>
internal static class ArchLucidRoleClaimExtractor
{
    private const string MicrosoftWsIdentityRoleClaimUri =
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

    private const string XmlSoap2005RoleClaimUri =
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role";

    internal static readonly HashSet<string> KnownArchLucidMappedRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        ArchLucidRoles.PlatformOperator,
        ArchLucidRoles.Admin,
        ArchLucidRoles.WorkspaceAdmin,
        ArchLucidRoles.Architect,
        ArchLucidRoles.Operator,
        ArchLucidRoles.Reviewer,
        ArchLucidRoles.Reader,
        ArchLucidRoles.Auditor,
    };

    internal static HashSet<string> ExtractRoleValues(ClaimsPrincipal principal)
    {
        HashSet<string> roles = new(StringComparer.OrdinalIgnoreCase);

        foreach (Claim claim in principal.FindAll(ClaimTypes.Role))
            ExpandRolesClaimJsonArray(claim.Value, roles);

        foreach (Claim claim in principal.FindAll("roles"))
            ExpandRolesClaimJsonArray(claim.Value, roles);

        foreach (Claim claim in principal.FindAll(MicrosoftWsIdentityRoleClaimUri))
            ExpandRolesClaimJsonArray(claim.Value, roles);

        foreach (Claim claim in principal.FindAll(XmlSoap2005RoleClaimUri))
            ExpandRolesClaimJsonArray(claim.Value, roles);

        return roles;
    }

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
                    foreach (string value in arr)
                    {
                        if (!string.IsNullOrWhiteSpace(value))
                            sink.Add(value);
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
