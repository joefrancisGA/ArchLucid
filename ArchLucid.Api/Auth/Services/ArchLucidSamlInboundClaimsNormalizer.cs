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

        DeduplicateCanonicalGuidScopeClaims(identity);
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

        string normalizedSource = sourceClaimType.Trim();

        List<string> distinctIncomingValues = identity.Claims
            .Where(c => string.Equals(c.Type, normalizedSource, StringComparison.OrdinalIgnoreCase))
            .Select(c => c.Value.Trim())
            .Where(v => v.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (distinctIncomingValues.Count != 1)
            return;

        string trimmed = distinctIncomingValues[0];

        if (IsGuidScopeClaimType(targetClaimType) && !Guid.TryParse(trimmed, out _))
            return;

        if (identity.HasClaim(targetClaimType, trimmed))
            return;

        foreach (Claim existing in identity.Claims
                     .Where(c => string.Equals(c.Type, targetClaimType, StringComparison.OrdinalIgnoreCase))
                     .ToList())
        {
            identity.RemoveClaim(existing);
        }

        identity.AddClaim(new Claim(targetClaimType, trimmed));
    }

    private static bool IsGuidScopeClaimType(string targetClaimType) =>
        targetClaimType is "tenant_id" or "workspace_id" or "project_id";

    private static void DeduplicateCanonicalGuidScopeClaims(ClaimsIdentity identity)
    {
        DeduplicateCanonicalGuidScopeClaim(identity, "tenant_id");
        DeduplicateCanonicalGuidScopeClaim(identity, "workspace_id");
        DeduplicateCanonicalGuidScopeClaim(identity, "project_id");
    }

    private static void DeduplicateCanonicalGuidScopeClaim(ClaimsIdentity identity, string claimType)
    {
        List<Claim> existing = identity.Claims
            .Where(c => string.Equals(c.Type, claimType, StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (existing.Count <= 1)
            return;

        List<Guid> distinctParseable = existing
            .Select(static c => c.Value)
            .Select(static value => Guid.TryParse(value, out Guid parsed) ? parsed : (Guid?)null)
            .Where(static parsed => parsed is not null)
            .Select(static parsed => parsed!.Value)
            .Distinct()
            .ToList();

        foreach (Claim claim in existing)
            identity.RemoveClaim(claim);

        if (distinctParseable.Count != 1)
            return;

        identity.AddClaim(new Claim(claimType, distinctParseable[0].ToString("D")));
    }
}
