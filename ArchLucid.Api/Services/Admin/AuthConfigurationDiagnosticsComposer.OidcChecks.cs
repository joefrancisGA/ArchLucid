using System.Text.Json;

using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Core.Identity;

namespace ArchLucid.Api.Services.Admin;

public static partial class AuthConfigurationDiagnosticsComposer
{
    private static readonly JsonSerializerOptions ClaimMappingJsonOptions = new(JsonSerializerDefaults.Web);

    private static bool IsAudienceConfigured(AdminOidcDiagnosticsResponse oidc)
    {
        if (!string.IsNullOrWhiteSpace(oidc.ConfiguredAudience))
            return true;

        if (oidc.UsesLocalJwtSigningKey && !string.IsNullOrWhiteSpace(oidc.LocalJwtAudience))
            return true;

        return false;
    }

    private static bool IsIssuerOrAuthorityConfigured(
        AdminOidcDiagnosticsResponse oidc,
        ArchLucidSamlAuthOptions samlOptions)
    {
        if (!string.IsNullOrWhiteSpace(oidc.ConfiguredAuthority))
            return true;

        if (oidc.UsesLocalJwtSigningKey && !string.IsNullOrWhiteSpace(oidc.LocalJwtIssuer))
            return true;

        if (samlOptions.Enabled && IsSpEntityIdConfigured(samlOptions) == true)
            return true;

        return false;
    }

    private static bool? EvaluateJwksConfigured(AdminOidcDiagnosticsResponse oidc)
    {
        if (oidc.UsesLocalJwtSigningKey)
            return true;

        if (!oidc.DiscoveryAttempted)
            return null;

        if (oidc.DiscoverySucceeded != true)
            return null;

        return !string.IsNullOrWhiteSpace(oidc.JwksUri);
    }

    private static bool? EvaluateRoleClaimNameConfigured(
        bool samlEnabled,
        bool? samlRoleSourcesConfigured,
        bool? tenantMappingConfigured,
        TenantIdentityProviderConfigurationRecord? tenantIdentityProvider)
    {
        if (tenantIdentityProvider is not null)
            return tenantMappingConfigured;

        if (samlEnabled)
            return samlRoleSourcesConfigured;

        return null;
    }

    private static bool IsSpEntityIdConfigured(ArchLucidSamlAuthOptions samlOptions)
    {
        string issuer = samlOptions.Issuer?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(issuer))
            return false;

        return Uri.TryCreate(issuer, UriKind.Absolute, out _);
    }

    private static bool HasSamlRoleClaimSources(ArchLucidSamlAuthOptions samlOptions)
    {
        string[] sources = samlOptions.RoleClaimSources ?? [];

        return sources.Any(static s => !string.IsNullOrWhiteSpace(s));
    }

    private static (bool? Configured, string? Protocol) EvaluateTenantClaimMapping(
        TenantIdentityProviderConfigurationRecord? tenantIdentityProvider)
    {
        if (tenantIdentityProvider is null)
            return (null, null);

        string protocol = tenantIdentityProvider.Protocol.ToString();

        if (string.IsNullOrWhiteSpace(tenantIdentityProvider.ClaimMappingJson))
            return (false, protocol);

        try
        {
            IdentityClaimRoleMappingDocument? mapping =
                JsonSerializer.Deserialize<IdentityClaimRoleMappingDocument>(
                    tenantIdentityProvider.ClaimMappingJson,
                    ClaimMappingJsonOptions);

            if (mapping is null)
                return (false, protocol);

            bool roleClaimPresent = !string.IsNullOrWhiteSpace(mapping.RoleClaimName);
            bool hasEntries = mapping.Mappings.Count > 0;

            return (roleClaimPresent && hasEntries, protocol);
        }
        catch (JsonException)
        {
            return (false, protocol);
        }
    }
}
