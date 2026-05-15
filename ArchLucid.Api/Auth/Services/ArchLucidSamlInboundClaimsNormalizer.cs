using System.Security.Claims;

using ArchLucid.Api.Auth.Models;

using ITfoxtec.Identity.Saml2.Schemas;

namespace ArchLucid.Api.Auth.Services;

/// <summary>
///     Promotes IdP-specific SAML attribute claim types onto the canonical claim types used by JWT and
///     <see cref="HttpScopeContextProvider" /> so SCIM overrides and RBAC behave consistently for cookie sessions.
/// </summary>
internal static class ArchLucidSamlInboundClaimsNormalizer
{
    internal static void Apply(ClaimsIdentity identity, ArchLucidSamlAuthOptions options)
    {
        ArgumentNullException.ThrowIfNull(identity);
        ArgumentNullException.ThrowIfNull(options);

        if (!options.Enabled)
            return;

        if (!IsSaml2AuthenticatedIdentity(identity))
            return;

        if (options.RoleClaimSources is { Length: > 0 })
        {
            foreach (string source in options.RoleClaimSources)
            {
                if (string.IsNullOrWhiteSpace(source))
                    continue;

                PromoteIncomingRoleValues(identity, source.Trim());
            }
        }

        PromoteSingleValueIfMissing(identity, options.TenantIdClaimType, "tenant_id");
        PromoteSingleValueIfMissing(identity, options.WorkspaceIdClaimType, "workspace_id");
        PromoteSingleValueIfMissing(identity, options.ProjectIdClaimType, "project_id");
        PromoteSingleValueIfMissing(identity, options.DirectoryObjectIdClaimType, "oid");
    }

    internal static bool IsSaml2AuthenticatedIdentity(ClaimsIdentity identity)
    {
        if (identity is null || !identity.IsAuthenticated)
            return false;

        if (string.Equals(identity.AuthenticationType, Saml2Constants.AuthenticationScheme, StringComparison.Ordinal))
            return true;

        return string.Equals(identity.AuthenticationType, Saml2Constants.AuthenticationScheme, StringComparison.OrdinalIgnoreCase);
    }

    private static void PromoteIncomingRoleValues(ClaimsIdentity identity, string sourceClaimType)
    {
        // Do not use FindAll + mutate: ClaimsIdentity may back claims with a single iterator-unsafe store.
        List<string> inboundValues = identity.Claims
            .Where(c => string.Equals(c.Type, sourceClaimType, StringComparison.OrdinalIgnoreCase))
            .Select(c => c.Value)
            .ToList();

        foreach (string raw in inboundValues)
        {
            if (string.IsNullOrWhiteSpace(raw))
                continue;

            AddRoleSurfaceClaims(identity, raw.Trim());
        }
    }

    private static void AddRoleSurfaceClaims(ClaimsIdentity identity, string roleValue)
    {
        if (!identity.HasClaim("roles", roleValue))
            identity.AddClaim(new Claim("roles", roleValue));

        if (!identity.HasClaim(ClaimTypes.Role, roleValue))
            identity.AddClaim(new Claim(ClaimTypes.Role, roleValue));
    }

    private static void PromoteSingleValueIfMissing(ClaimsIdentity identity, string? sourceClaimType, string targetClaimType)
    {
        if (string.IsNullOrWhiteSpace(sourceClaimType))
            return;

        Claim? incoming = identity.FindFirst(sourceClaimType.Trim());

        if (incoming is null || string.IsNullOrWhiteSpace(incoming.Value))
            return;

        string trimmed = incoming.Value.Trim();

        if (identity.HasClaim(targetClaimType, trimmed))
            return;

        identity.AddClaim(new Claim(targetClaimType, trimmed));
    }
}
